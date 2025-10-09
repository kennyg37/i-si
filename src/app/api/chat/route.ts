import { streamText, convertToModelMessages } from 'ai';
import { ai, systemPrompts } from '@/lib/ai/config';
import { climateTools } from '@/lib/ai/tools';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, agent = 'climateAnalyst' } = await req.json();

    console.log('Received messages:', JSON.stringify(messages, null, 2));

    // Select system prompt based on agent type
    const systemPrompt = systemPrompts[agent as keyof typeof systemPrompts] || systemPrompts.climateAnalyst;

    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: ai.model,
      system: systemPrompt,
      messages: modelMessages,
      tools: climateTools,
    });

    // Return as UI message stream response
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
