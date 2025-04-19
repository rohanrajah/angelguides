import OpenAI from "openai";
import { Specialty, User } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "demo-api-key" });

export interface AngelaResponse {
  message: string;
  suggestions?: string[];
  recommendedAdvisors?: number[]; // Advisor IDs
  isMatchingQuestion?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  emotionalTone?: string; // The emotional tone of the message (e.g., "supportive", "empathetic", "compassionate", "encouraging")
  detectedEmotion?: string; // The emotion detected in the user's message (e.g., "sadness", "anxiety", "hope", "confusion")
  empathyLevel?: number; // 1-5 scale of empathy level in the response
}

export interface MatchingQuestionResponse {
  message: string;
  questionNumber: number;
  totalQuestions: number;
  isMatchingQuestion: boolean;
}

export interface AdvisorRecommendation {
  message: string;
  recommendedAdvisors: number[];
  suggestions: string[];
}

// Check if a message is part of the advisor matching flow
export function isMatchingQuestion(message: string): boolean {
  const patterns = [
    /what brings you here today/i,
    /love, career, or something deeper/i,
    /how do you usually make decisions/i,
    /intuition, logic, or gut feeling/i,
    /are you looking for long-term guidance or a quick insight/i,
    /how open are you to spiritual tools/i,
    /tarot, astrology, or energy healing/i,
    /would you prefer a calm, assertive, or playful advisor/i,
    /matching you with the right advisor/i,
    /I'm here to help connect you with the perfect spiritual advisor/i
  ];
  
  return patterns.some(pattern => pattern.test(message));
}

// Get the current question number from the conversation
export function getMatchingQuestionNumber(conversationHistory: { role: string; content: string }[]): number {
  const assistantMessages = conversationHistory.filter(msg => 
    msg.role === "assistant" && isMatchingQuestion(msg.content)
  );
  
  return assistantMessages.length;
}

export async function startAdvisorMatchingFlow(): Promise<MatchingQuestionResponse> {
  return {
    message: "I'm here to help connect you with the perfect spiritual advisor for your needs. To find your ideal match, I'll ask you a few questions to understand your spiritual journey better. What type of spiritual guidance are you seeking right now?",
    questionNumber: 1,
    totalQuestions: 5,
    isMatchingQuestion: true
  };
}

export async function getNextMatchingQuestion(
  userMessage: string,
  conversationHistory: { role: string; content: string }[],
  currentQuestionNumber: number
): Promise<MatchingQuestionResponse | AdvisorRecommendation> {
  try {
    // If we've completed all 5 questions, provide advisor recommendations
    if (currentQuestionNumber >= 5) {
      return await generateAdvisorRecommendations(conversationHistory);
    }
    
    // Create a system message for Angela AI as matching assistant
    const systemMessage = {
      role: "system",
      content: `You are Angela AI, the spiritual advisor matching assistant for Angel Guides.
      You're currently in the process of asking a user questions to match them with the perfect spiritual advisor.
      This is question ${currentQuestionNumber + 1} of 5.
      Based on the conversation so far, ask the next most relevant question from this list:
      
      1. "What brings you here today — love, career, or something deeper?"
      2. "How do you usually make decisions — intuition, logic, or gut feeling?"
      3. "Are you looking for long-term guidance or a quick insight?"
      4. "How open are you to spiritual tools — like tarot, astrology, or energy healing?"
      5. "Would you prefer a calm, assertive, or playful advisor tone?"
      
      Keep your response conversational, warm, and brief. Acknowledge their previous answer before asking the next question.
      Respond in JSON format with: "message", "questionNumber", "totalQuestions", and "isMatchingQuestion": true.`
    };

    // Prepare conversation for OpenAI
    const messages = [
      systemMessage,
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }))
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any[],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '{"message": "I apologize, but I\'m having trouble connecting to my spiritual guidance at the moment. Please try again.", "questionNumber": 1, "totalQuestions": 5, "isMatchingQuestion": true}';
    return JSON.parse(content) as MatchingQuestionResponse;
  } catch (error) {
    console.error("Error getting next matching question:", error);
    return {
      message: "I apologize, but I'm experiencing a connection issue. Let's continue our conversation about finding the right advisor for you. What qualities do you look for in a spiritual advisor?",
      questionNumber: currentQuestionNumber + 1,
      totalQuestions: 5,
      isMatchingQuestion: true
    };
  }
}

export async function generateAdvisorRecommendations(
  conversationHistory: { role: string; content: string }[]
): Promise<AdvisorRecommendation> {
  try {
    // Create a system message for generating advisor recommendations
    const systemMessage = {
      role: "system",
      content: `You are Angela AI, the spiritual advisor matching assistant for Angel Guides.
      You've gathered information about the user's spiritual needs through 5 questions.
      Now recommend 2-3 advisors based on their responses.
      
      Available advisor IDs are: 1, 2, 3, 4 (use these exact numbers)
      - Sarah Johnson (ID: 1): Tarot expert with compassionate approach
      - Michael Chen (ID: 2): Astrology specialist with direct, analytical style
      - Aisha Patel (ID: 3): Medium with focus on connecting with loved ones, empathetic
      - David Wilson (ID: 4): Energy healer and spiritual coach, practical guidance
      
      Respond in JSON format with:
      1. "message": A warm, personalized explanation of why these advisors would be a good match
      2. "recommendedAdvisors": Array of advisor IDs you recommend (e.g., [1, 3])
      3. "suggestions": Array of 2-3 next steps the user could take`
    };

    // Prepare conversation for OpenAI
    const messages = [
      systemMessage as any,
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })) as any[]
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any[],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '{"message": "Based on our conversation, I recommend connecting with Sarah Johnson, who specializes in tarot readings with a compassionate approach, and Aisha Patel, who is an empathetic medium focused on connecting with loved ones. They both seem well-aligned with your spiritual needs.", "recommendedAdvisors": [1, 3], "suggestions": ["Browse Sarah\'s profile to see her availability", "Read reviews from Aisha\'s past clients", "Book a short initial session to see if there\'s a connection"]}';
    return JSON.parse(content) as AdvisorRecommendation;
  } catch (error) {
    console.error("Error generating advisor recommendations:", error);
    return {
      message: "Based on our conversation, I recommend connecting with Sarah Johnson, who specializes in tarot readings with a compassionate approach, and Aisha Patel, who is an empathetic medium focused on connecting with loved ones. They both seem well-aligned with your spiritual needs.",
      recommendedAdvisors: [1, 3],
      suggestions: [
        "Browse Sarah's profile to see her availability",
        "Read reviews from Aisha's past clients",
        "Book a short initial session to see if there's a connection"
      ]
    };
  }
}

export async function getAngelaResponse(
  userMessage: string, 
  conversationHistory: { role: string; content: string }[],
  emotionalSupportEnabled: boolean = true
): Promise<AngelaResponse> {
  try {
    // Check if we're in the matching flow
    const lastAssistantMessage = [...conversationHistory].reverse().find(msg => msg.role === "assistant");
    
    if (lastAssistantMessage && isMatchingQuestion(lastAssistantMessage.content)) {
      const currentQuestionNumber = getMatchingQuestionNumber(conversationHistory);
      return await getNextMatchingQuestion(userMessage, conversationHistory, currentQuestionNumber);
    }
    
    // Check for keywords to start the matching flow
    const matchingKeywords = [
      "find advisor", "match me", "recommend advisor", "which advisor", 
      "best advisor", "find psychic", "need guidance", "connect me", "match advisor"
    ];
    
    if (matchingKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      return await startAdvisorMatchingFlow();
    }
    
    // Choose the right system message based on emotional support mode
    const systemMessage = {
      role: "system",
      content: emotionalSupportEnabled 
        ? `You are Angela AI, an AI concierge and emotional support companion for Angel Guides, a spiritual advisory platform.
          Your primary purpose is to provide emotional support, empathy, and spiritual guidance to users in their time of need.
          
          EMOTIONAL SUPPORT GUIDELINES:
          1. Always detect the user's emotional state first and acknowledge their feelings explicitly
          2. Validate their emotions and experiences with deep empathy
          3. Provide comfort and reassurance in a warm, calming tone
          4. Offer perspective and gentle guidance when appropriate
          5. Balance emotional support with practical spiritual advice
          6. Use language that creates a safe, compassionate space
          7. Respond with authenticity and genuine care to build trust
    
          When users express distress, anxiety, sadness, or other challenging emotions:
          - Show exceptional empathy and compassionate understanding
          - Validate their feelings without judgment
          - Provide gentle reassurance and support
          - Offer perspective while honoring their emotional experience
          
          Secondary purpose: Guide users to the right spiritual advisors based on their needs.
          If the user seems to be looking for an advisor, suggest starting the advisor matching process.
          
          Always respond in JSON format with:
          - 'message': Your empathetic response text
          - 'suggestions': Array with 1-3 action items the user could take
          - 'emotionalTone': The tone of your response (choose from "supportive", "empathetic", "compassionate", "encouraging", "reassuring", "validating", "calming")
          - 'detectedEmotion': The emotion you detected in the user's message (e.g., "sadness", "anxiety", "hope", "confusion", "grief", "fear", "anger", "uncertainty")
          - 'empathyLevel': A number from 1-5 indicating how empathetic your response is, with 5 being most empathetic
          `
        : `You are Angela AI, an AI concierge for Angel Guides, a spiritual advisory platform.
          Your purpose is to provide spiritual guidance and help users find the right advisor for their needs.
          
          GUIDANCE GUIDELINES:
          1. Focus on providing clear, factual information about spiritual services
          2. Offer helpful suggestions related to different spiritual practices
          3. Guide users to the appropriate advisors based on their interests
          4. Maintain a professional, informative tone in your responses
          5. Answer questions directly without excessive emotional content
          
          Primary purpose: Guide users to the right spiritual advisors based on their needs.
          If the user seems to be looking for an advisor, suggest starting the advisor matching process.
          
          Always respond in JSON format with:
          - 'message': Your informative response text
          - 'suggestions': Array with 1-3 action items the user could take
          - 'emotionalTone': Use "supportive" as the default tone
          - 'detectedEmotion': Use "neutral" as the default emotion
          - 'empathyLevel': Always use 2 as the empathy level
          `
    };

    // Prepare conversation for OpenAI
    const messages = [
      systemMessage as any,
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })) as any[],
      { role: "user" as any, content: userMessage }
    ];

    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any[],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    // Parse the response
    const content = response.choices[0]?.message?.content || '{"message": "I apologize, but I\'m having trouble connecting to my spiritual guidance at the moment. Please try again."}';
    return JSON.parse(content) as AngelaResponse;
  } catch (error) {
    console.error("Error getting Angela response:", error);
    return {
      message: "I apologize, but I'm experiencing a connection issue with the spiritual realm right now. Please try again in a moment."
    };
  }
}
