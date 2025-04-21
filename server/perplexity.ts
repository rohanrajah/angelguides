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
      messages: [...messages], // Create a copy to avoid modifying the original
      temperature: options.temperature || 0.2,
      max_tokens: options.maxTokens || 500,
      top_p: 0.9,
      stream: false,
      frequency_penalty: 1,
      presence_penalty: 0,
      return_images: false,
      return_related_questions: false
    };

    // Create a properly formatted message array for Perplexity API
    // Extract any system message first
    const systemMessage = messages.find(msg => msg.role === 'system');
    let systemContent = '';
    
    if (systemMessage) {
      systemContent = systemMessage.content;
      
      // If format is 'json', ensure the system message includes JSON format instructions
      if (options.format === 'json') {
        systemContent += '\n\nYou must respond in valid JSON format only. Ensure your response can be parsed by JSON.parse() without any errors or additional text.';
      }
    } else if (options.format === 'json') {
      // If no system message but JSON format is requested, create system message
      systemContent = 'You must respond in valid JSON format only. Ensure your response can be parsed by JSON.parse() without any errors or additional text.';
    }
    
    // Create a new messages array with properly alternating roles
    const messagesForPayload: PerplexityMessage[] = [];
    
    // Add the system message if we have one
    if (systemContent) {
      messagesForPayload.push({
        role: 'system',
        content: systemContent
      });
    }
    
    // Filter out system messages and create alternating user/assistant pairs
    const nonSystemMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
    
    // Perplexity requires:
    // 1. First non-system message must be from user
    // 2. Messages must alternate user/assistant
    // 3. Last message must be from user
    
    if (nonSystemMessages.length === 0) {
      // If no messages, add a default user message
      messagesForPayload.push({
        role: 'user',
        content: 'Please provide guidance.'
      });
    } else {
      // Force the first message to be from the user by inserting if needed
      if (nonSystemMessages[0].role !== 'user') {
        messagesForPayload.push({
          role: 'user',
          content: 'Hello, I need guidance.'
        });
      }
      
      // Add pairs of messages, ensuring proper alternation
      let lastProcessedRole: 'user' | 'assistant' | null = null;
      
      for (const msg of nonSystemMessages) {
        // Skip if same role as previous message (no consecutive same roles allowed)
        if (lastProcessedRole === msg.role) continue;
        
        // If we need to ensure alternation and we have a gap, insert message
        if (lastProcessedRole !== null && 
            lastProcessedRole === 'user' && 
            msg.role === 'user') {
          // Insert an assistant message to maintain alternation
          messagesForPayload.push({
            role: 'assistant',
            content: 'I understand. Please tell me more.'
          });
        } else if (lastProcessedRole !== null && 
                   lastProcessedRole === 'assistant' && 
                   msg.role === 'assistant') {
          // Insert a user message to maintain alternation
          messagesForPayload.push({
            role: 'user',
            content: 'Please continue.'
          });
        }
        
        // Add the current message (ensure it's typed correctly)
        messagesForPayload.push({
          role: msg.role as 'user' | 'assistant', 
          content: msg.content
        });
        lastProcessedRole = msg.role as 'user' | 'assistant';
      }
      
      // Ensure the last message is from the user
      if (lastProcessedRole === 'assistant') {
        messagesForPayload.push({
          role: 'user',
          content: 'Please help me with this.'
        });
      }
    }
    
    // Replace the messages in the payload
    payload.messages = messagesForPayload;
    
    // For debugging purposes, print the full message array
    console.log('Perplexity API Messages:');
    payload.messages.forEach((msg, i) => {
      console.log(`[${i}] Role: ${msg.role}, Content: ${msg.content.substring(0, 50)}...`);
    });
    
    // Extra check for alternating roles - system messages only at the beginning, 
    // followed by alternating user and assistant roles ending with user
    let expectedRole = 'user';
    let problemFound = false;
    let systemFound = false;
    
    for (let i = 0; i < payload.messages.length; i++) {
      const msg = payload.messages[i];
      
      // System messages only allowed at the beginning
      if (msg.role === 'system') {
        if (i > 0 && systemFound) {
          console.error(`ERROR: System message at position ${i} (not at beginning)`);
          problemFound = true;
        }
        systemFound = true;
        continue;
      }
      
      // After system (if any), must alternate user/assistant starting with user
      if (msg.role !== expectedRole) {
        console.error(`ERROR: Expected role ${expectedRole} at position ${i}, but found ${msg.role}`);
        problemFound = true;
      }
      
      // Toggle expected role for next message
      expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
    }
    
    // Must end with user message
    if (payload.messages.length > 0 && 
        payload.messages[payload.messages.length - 1].role !== 'user') {
      console.error('ERROR: Last message is not from user');
      problemFound = true;
    }
    
    if (problemFound) {
      console.error('WARNING: Message sequence likely violates Perplexity requirements');
    } else {
      console.log('Message sequence looks valid');
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

    // Get the raw response content
    let rawContent = response.data.choices[0].message.content;
    
    // If format is 'json', clean the potential code blocks and handle non-JSON responses
    if (options.format === 'json') {
      console.log('Raw JSON response from Perplexity:', rawContent);
      
      try {
        // First try to parse it directly
        JSON.parse(rawContent);
      } catch (jsonError) {
        // Couldn't parse directly, try to clean it up
        
        // Remove markdown code block syntax if present
        if (rawContent.includes('```json')) {
          rawContent = rawContent.replace(/```json\s*|\s*```/g, '');
        } else if (rawContent.includes('```')) {
          rawContent = rawContent.replace(/```\s*|\s*```/g, '');
        }
        
        // Trim any leading/trailing whitespace
        rawContent = rawContent.trim();
        
        // Check for Markdown/text formatting and attempt to convert to JSON
        // Common pattern: Response starts with a heading like "###"
        if (rawContent.startsWith('#')) {
          console.log('Attempting to convert Markdown-formatted response to JSON');
          
          // Create a simple fallback JSON structure
          const fallbackJson = {
            message: rawContent.substring(0, 500), // First 500 chars
            suggestions: [],
            emotionalTone: "Supportive"
          };
          
          rawContent = JSON.stringify(fallbackJson);
        }
        
        // Validate the cleanup worked
        try {
          JSON.parse(rawContent);
          console.log('Successfully cleaned and parsed JSON response');
        } catch (secondError) {
          console.error('Failed to parse JSON even after cleaning:', secondError);
          // Final fallback - create a minimal valid JSON
          rawContent = JSON.stringify({
            message: "I apologize, but I'm having trouble processing your request at the moment. Could you please rephrase your question?",
            emotionalTone: "Apologetic"
          });
        }
      }
      
      console.log('Final cleaned JSON response from Perplexity:', rawContent);
    }
    
    // Return the processed response content
    return rawContent;
  } catch (err) {
    const error = err as any; // Type assertion for error handling
    console.error('Error calling Perplexity API:', error);
    
    if (error.response) {
      console.error('Perplexity API error response:', error.response.data);
    }
    
    const errorMessage = error.message || 'Unknown error';
    throw new Error(`Perplexity API call failed: ${errorMessage}`);
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