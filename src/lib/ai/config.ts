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
export function getSystemPrompt(options: ContextProviderOptions): string {
  // Build full context with provided options
  const context = buildAIContext({
    ...options,
    page: options.page || 'ai-chat',
    includeKnowledgeBase: options.includeKnowledgeBase ?? true,
  });

  // Build context-aware prompt
  return buildContextPrompt(context);
}

/**
 * Legacy system prompts for backward compatibility (static, no location)
 * Used when location context is not needed
 */
export const systemPrompts = {
  climateAnalyst: getSystemPrompt({ page: 'ai-chat', agent: 'climate' }),
  floodRiskAssessor: getSystemPrompt({ page: 'ai-chat', agent: 'flood' }),
  agriculturalAdvisor: getSystemPrompt({ page: 'ai-chat', agent: 'agriculture' }),
}

/**
 * Tool configurations for AI agents
 */
export const toolConfigs = {
  maxSteps: 5,
  maxToolRoundtrips: 3,
};
