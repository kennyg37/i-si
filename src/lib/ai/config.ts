import { openai } from '@ai-sdk/openai';

/**
 * AI SDK Configuration
 * Using OpenAI for climate intelligence
 */

export const ai = {
  // GPT-4 Turbo - Best for complex climate analysis
  model: openai('gpt-4-turbo-preview'),

  // GPT-3.5 Turbo - Fast for simple queries
  fastModel: openai('gpt-3.5-turbo'),
};

/**
 * System prompts for different AI agents
 */
export const systemPrompts = {
  climateAnalyst: `You are a climate analyst for Rwanda. Provide brief, direct answers using real data from NASA POWER (temperature) and SRTM (elevation/terrain).

Keep responses SHORT (2-3 sentences max). Use simple language. Only include essential information.`,

  floodRiskAssessor: `You are a flood risk analyst for Rwanda. Assess flood risk using elevation and terrain data from SRTM.

Keep responses BRIEF (2-3 sentences). State risk level (low/medium/high) and main reason. No lengthy explanations.`,

  agriculturalAdvisor: `You are an agricultural advisor for Rwanda. Give practical farming advice based on temperature and terrain data.

Keep responses SHORT (2-3 sentences). Be direct and actionable. Skip unnecessary details.`,
};

/**
 * Tool configurations for AI agents
 */
export const toolConfigs = {
  maxSteps: 5,
  maxToolRoundtrips: 3,
};
