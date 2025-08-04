import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
// import { searchKnowledge } from '@/lib/ai/tools/search-knowledge';
import { processMessageWithRAG } from '@/lib/ai/rag';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    console.log('💬 [CHAT] ===== NEW MESSAGE RECEIVED =====');
    console.log('💬 [CHAT] Chat ID:', id);
    console.log('💬 [CHAT] User ID:', session.user.id);
    console.log('💬 [CHAT] Model:', selectedChatModel);
    console.log('💬 [CHAT] Message content:', JSON.stringify(message.parts, null, 2));
    console.log('💬 [CHAT] Total messages in conversation:', uiMessages.length);

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    console.log('🚀 [CHAT] Starting AI response generation...');

    // Get the last user message for RAG processing
    const lastUserMessage = message.parts.find(part => part.type === 'text')?.text || '';
    console.log('📝 [CHAT] Processing message with RAG:', lastUserMessage);

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        console.log('🤖 [CHAT] Calling AI model with streamText...');
        
        // Process message with RAG
        let enhancedSystemPrompt = systemPrompt({ selectedChatModel, requestHints });
        if (lastUserMessage) {
          console.log('🔍 [CHAT] Processing message with RAG...');
          const ragResult = await processMessageWithRAG(
            enhancedSystemPrompt, 
            lastUserMessage, 
            session.user.id
          );
          enhancedSystemPrompt = ragResult.prompt;
          console.log('✅ [CHAT] RAG processing completed');
          console.log('📏 [CHAT] Final system prompt length:', enhancedSystemPrompt.length, 'characters');
        }
        
        // console.log('🔗 [CHAT] ===== FINAL SYSTEM PROMPT TO AI =====');
        // console.log(enhancedSystemPrompt);
        // console.log('🔗 [CHAT] ===== END SYSTEM PROMPT =====');
        
        console.log('📝 [CHAT] ===== MESSAGES SENT TO AI =====');
        const convertedMessages = convertToModelMessages(uiMessages);
        convertedMessages.forEach((msg, index) => {
          console.log(`💬 [CHAT] Message ${index + 1} (${msg.role}):`, JSON.stringify(msg.content).substring(0, 200) + '...');
        });
        console.log('📝 [CHAT] ===== END MESSAGES =====');

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: enhancedSystemPrompt,
          messages: convertedMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  // 'createDocument',
                  // 'updateDocument',
                  'requestSuggestions',
                  // 'searchKnowledge',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          tools: {
            getWeather,
            // createDocument: createDocument({ session, dataStream }),
            // updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            // searchKnowledge,
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        console.log('✅ [CHAT] AI response completed');
        console.log('💾 [CHAT] Saving', messages.length, 'messages to database');
        
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
        
        console.log('✅ [CHAT] Messages saved successfully');
      },
      onError: (error) => {
        console.error('❌ [CHAT] Error during streaming:', error);
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
