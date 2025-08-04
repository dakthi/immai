import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getRAGSettings, updateRAGSettings, type RAGSettings } from '@/lib/rag-settings';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = getRAGSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error getting RAG settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate the settings
    const validSettings: Partial<RAGSettings> = {};
    
    if (typeof body.threshold === 'number' && body.threshold >= 0.1 && body.threshold <= 0.9) {
      validSettings.threshold = body.threshold;
    }
    
    if (typeof body.maxResults === 'number' && body.maxResults >= 1 && body.maxResults <= 10) {
      validSettings.maxResults = body.maxResults;
    }
    
    if (typeof body.maxExcerpts === 'number' && body.maxExcerpts >= 1 && body.maxExcerpts <= 8) {
      validSettings.maxExcerpts = body.maxExcerpts;
    }
    
    if (typeof body.temperature === 'number' && body.temperature >= 0.0 && body.temperature <= 2.0) {
      validSettings.temperature = body.temperature;
    }
    
    if (typeof body.minThreshold === 'number' && body.minThreshold >= 0.1 && body.minThreshold <= 0.6) {
      validSettings.minThreshold = body.minThreshold;
    }

    const updatedSettings = updateRAGSettings(validSettings);
    
    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating RAG settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}