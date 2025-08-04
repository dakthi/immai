<h1 align="center">🍁 IMM AI</h1>

<p align="center">
    Trợ lý AI chuyên hỗ trợ người Việt Nam định cư Canada - tư vấn visa, việc làm, và cuộc sống mới.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Model Providers

IMM AI sử dụng [OpenAI](https://openai.com) GPT-4o làm mô hình AI chính. Với [AI SDK](https://sdk.vercel.ai/docs), bạn có thể dễ dàng chuyển đổi sang các nhà cung cấp khác như [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/) nếu cần.

## Deploy Your Own

Bạn có thể triển khai IMM AI trên server của riêng mình:

```bash
# Clone repository
git clone https://github.com/your-username/imm-ai.git

# Install dependencies  
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your OpenAI API key and database URL

# Run migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## Running locally

Bạn cần cấu hình các biến môi trường trong file `.env.local`:

```bash
# Required
AUTH_SECRET="your-auth-secret"
OPENAI_API_KEY="your-openai-api-key"
POSTGRES_URL="postgresql://username:password@localhost:5432/database"

# Optional
REDIS_URL="your-redis-url"
```

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

```bash
pnpm install
pnpm dev
```

IMM AI sẽ chạy tại [localhost:3000](http://localhost:3000).
