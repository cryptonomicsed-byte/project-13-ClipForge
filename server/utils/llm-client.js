import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import pino from 'pino';

const logger = pino();

let clients = {};

export function createClient(provider = 'claude') {
  if (clients[provider]) {
    return clients[provider];
  }

  switch (provider) {
    case 'claude':
    case 'anthropic':
      clients.claude = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      return clients.claude;

    case 'openai':
      clients.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      return clients.openai;

    default:
      logger.warn(`Unknown LLM provider: ${provider}, defaulting to Claude`);
      return createClient('claude');
  }
}

/**
 * Call Claude for AI analysis
 */
export async function callClaude(prompt, maxTokens = 2000) {
  const client = createClient('claude');

  try {
    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.content[0].text;
  } catch (error) {
    logger.error(error, 'Claude API call failed');
    throw error;
  }
}

/**
 * Call OpenAI GPT for analysis
 */
export async function callOpenAI(prompt, maxTokens = 2000) {
  const client = createClient('openai');

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error(error, 'OpenAI API call failed');
    throw error;
  }
}
