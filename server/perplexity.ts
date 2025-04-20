import axios from 'axios';

/**
 * Interface for Perplexity API request message
 */
interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for Perplexity API request
 */
interface PerplexityRequest {
  model: string;
  messages: PerplexityMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: string;
  top_k?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

/**
 * Interface for Perplexity API response
 */
interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Default Perplexity model to use
 */
const DEFAULT_MODEL = 'llama-3.1-sonar-small-128k-online';

/**
 * Call the Perplexity API with a prompt
 * 
 * @param messages Array of messages to send to the API
 * @param options Additional options for the API call
 * @returns The response from the API
 */
export async function callPerplexityAPI(
  messages: PerplexityMessage[],
  options: {
    model?: string,
    temperature?: number,
    maxTokens?: number,
    format?: 'json' | 'text'
  } = {}
): Promise<string> {
  try {
    // Make sure we have an API key
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY environment variable is not set');
    }

    // Configure the API request
    const payload: PerplexityRequest = {
      model: options.model || DEFAULT_MODEL,
      messages,
      temperature: options.temperature || 0.2,
      max_tokens: options.maxTokens || 500,
      top_p: 0.9,
      stream: false,
      frequency_penalty: 1,
      presence_penalty: 0,
      return_images: false,
      return_related_questions: false
    };

    // If format is 'json', add a system message to request JSON output
    if (options.format === 'json' && !messages.some(m => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You must respond in valid JSON format. Ensure your response can be parsed by JSON.parse().'
      });
    }

    // Make the API call
    const response = await axios.post<PerplexityResponse>(
      'https://api.perplexity.ai/chat/completions',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Return the response content
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    if (error.response) {
      console.error('Perplexity API error response:', error.response.data);
    }
    throw new Error(`Perplexity API call failed: ${error.message}`);
  }
}

/**
 * Example of how to use the Perplexity API for different purposes
 */
export async function examplePerplexityUsage() {
  // Example 1: Simple question
  const simpleResponse = await callPerplexityAPI([
    { role: 'user', content: 'Tell me about astrology and its connection to spirituality.' }
  ]);

  // Example 2: JSON response format
  const jsonResponse = await callPerplexityAPI([
    { role: 'user', content: 'Generate a horoscope for Taurus in JSON format with fields: sign, date, prediction, luckyNumber, and compatibility.' }
  ], { format: 'json' });

  // Example 3: More creative/spiritual response
  const creativeResponse = await callPerplexityAPI([
    { role: 'system', content: 'You are a spiritual guide with a warm, compassionate tone. Offer deep spiritual insights.' },
    { role: 'user', content: 'I feel lost in my life right now. What spiritual practices might help me find my path?' }
  ], { temperature: 0.7 });

  console.log({ simpleResponse, jsonResponse, creativeResponse });
}