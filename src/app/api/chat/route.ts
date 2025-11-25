import { streamText, convertToModelMessages } from 'ai';
import { ai, getSystemPrompt } from '@/lib/ai/config';
import { climateTools } from '@/lib/ai/tools';
import type { AgentType } from '@/lib/context/types';

export const runtime = 'edge';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, agent = 'climateAnalyst', location } = await req.json();

    console.log('Received messages:', JSON.stringify(messages, null, 2));

    // Map frontend agent names to internal agent types
    const agentMap: Record<string, AgentType> = {
      climateAnalyst: 'climate',
      floodRiskAssessor: 'flood',
      agriculturalAdvisor: 'agriculture',
    };

    const agentType = agentMap[agent] || 'climate';
    const prompt = getSystemPrompt({ page: 'ai-chat', agent: agentType, location })
    
    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: ai.model,
      system: prompt,
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
