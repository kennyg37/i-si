import { openai } from '@ai-sdk/openai';
import { buildContextPrompt } from '../context/prompt-builder';
import { buildAIContext } from '../context/context-provider';
import type { ContextProviderOptions } from '../context/types';

/**
 * AI SDK Configuration
 * Using OpenAI for climate intelligence with context awareness
 */

export const ai = {
  // GPT-4 Turbo - Best for complex climate analysis
  model: openai('gpt-4-turbo-preview'),

  // GPT-3.5 Turbo - Fast for simple queries
  fastModel: openai('gpt-3.5-turbo'),
};

/**
 * Get context-aware system prompt
 */
export function getSystemPrompt(options?: ContextProviderOptions): string {
  // Build full context
  const context = buildAIContext(options || {
    page: 'ai-chat',
    includeKnowledgeBase: true,
  });

  // Build context-aware prompt
  return buildContextPrompt(context);
}

/**
 * Legacy system prompts for backward compatibility
 * New implementation should use getSystemPrompt() instead
 */
export const systemPrompts = {
  climateAnalyst: getSystemPrompt({ page: 'ai-chat' }),

  floodRiskAssessor: `You are a flood risk analyst for Rwanda with comprehensive knowledge of the country's geography and climate.

LOCATION INTELLIGENCE:
- Know major cities: Kigali (-1.9536, 30.0606), Butare (-2.5967, 29.7392), Gisenyi (-1.7039, 29.2567)
- When users mention locations, resolve them to coordinates automatically
- High-risk flood areas: Kigali (Nyabarongo Basin), Rusizi District, Eastern lowlands
- Flood season: March-May (Long Rainy Season)

RESPONSE STYLE:
- State risk level clearly (low/medium/high/extreme)
- Reference current season and typical patterns
- Mention specific risk factors (elevation, slope, rainfall)
- Keep responses concise but informative (3-5 sentences)
- Always provide actionable information`,

  agriculturalAdvisor: `You are an agricultural advisor for Rwanda with deep knowledge of regional farming conditions.

REGIONAL KNOWLEDGE:
- Highland regions (Kigali, Northern): Tea, coffee, potatoes (1500-2500m)
- Lowland regions (Eastern): Maize, cassava, cattle (<1500m)
- Current season patterns and planting recommendations
- Know which crops suit which elevation/climate zones

ADVICE STYLE:
- Give practical, season-appropriate recommendations
- Reference current weather patterns
- Mention suitable crops for the region
- Include timing and risk considerations
- Be direct and actionable (3-5 sentences)`,
};

/**
 * Tool configurations for AI agents
 */
export const toolConfigs = {
  maxSteps: 5,
  maxToolRoundtrips: 3,
};
