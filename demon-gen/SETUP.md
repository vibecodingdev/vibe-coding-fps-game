# Monster Generator Setup

## Environment Variables

Create a `.env.local` file in the monster-generator directory with the following content:

```
OPENSOTA_API_KEY=os_your_api_key_here
```

Replace `os_your_api_key_here` with your actual OpenSota API key.

## Getting an OpenSota API Key

1. Visit [OpenSota AI](https://opensota.ai)
2. Sign up for an account
3. Navigate to your dashboard
4. Generate an API key
5. Copy the key and paste it in your `.env.local` file

## Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3001`

## Testing the API

You can test the API directly using curl:

```bash
curl -X POST https://api.opensota.ai/openai/v1/chat/completions \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer YOUR_API_KEY" \
 -d '{
 "model": "z-ai/glm-4.5-air:free",
 "messages": [
 {"role": "user", "content": "Hello, how are you?"}
 ]
 }'
```

Replace `YOUR_API_KEY` with your actual API key.
