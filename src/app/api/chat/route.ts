import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { ai, getSystemPrompt } from '@/lib/ai/config';
import { climateTools } from '@/lib/ai/tools';
import type { AgentType } from '@/lib/context/types';
import { toolConfigs } from '@/lib/ai/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Helper to calculate start date from timeRange in days
 */
function calculateStartDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

export async function POST(req: Request) {
  try {
    const { messages, agent = 'climateAnalyst', location, insights } = await req.json();

    console.log('Received messages:', JSON.stringify(messages, null, 2));
    if (insights) {
      console.log('Insights context:', JSON.stringify(insights, null, 2));
    }

    // Map frontend agent names to internal agent types
    const agentMap: Record<string, AgentType> = {
      climateAnalyst: 'climate',
      floodRiskAssessor: 'flood',
      agriculturalAdvisor: 'agriculture',
    };

    const agentType = agentMap[agent] || 'climate';

    // Build context with insights data if available
    const prompt = getSystemPrompt({
      page: insights ? 'insights' : 'ai-chat',
      agent: agentType,
      location,
      data: insights ? {
        insights: insights.summary,
        dateRange: {
          start: calculateStartDate(insights.timeRange),
          end: new Date().toISOString().split('T')[0]
        },
        visibleData: {
          activeView: insights.activeTab,
          viewMode: insights.viewMode,
          timeRange: insights.timeRange,
        }
      } : undefined
    })
    
    // Convert UI messages to model messages
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: ai.fastModel,
      system: prompt,
      messages: modelMessages,
      tools: climateTools,
      stopWhen: stepCountIs(toolConfigs.maxSteps)
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
