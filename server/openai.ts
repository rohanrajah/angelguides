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
    /what (type of |kind of |)guidance are you seeking/i,
    /what (specific |)challenges are you facing/i,
    /what (spiritual |)practices (do you |have you |)follow/i,
    /what are your spiritual goals/i,
    /have you worked with (a |an |)advisor before/i,
    /do you have a preference for/i,
    /what qualities do you look for/i,
    /would you prefer a male or female advisor/i,
    /matching you with the right advisor/i
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
      
      1. What type of spiritual guidance are you seeking right now? (e.g., clarity about the future, connecting with loved ones, career guidance)
      2. What specific challenges or questions are you hoping to address with a spiritual advisor?
      3. Do you have a preference for specific spiritual practices or traditions? (e.g., tarot, astrology, mediumship, energy healing)
      4. What qualities do you look for in a spiritual advisor? (e.g., compassionate, direct, experienced)
      5. Have you consulted with spiritual advisors before? If so, what was most helpful about that experience?
      
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
  conversationHistory: { role: string; content: string }[]
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
    
    // Regular conversation flow
    const systemMessage = {
      role: "system",
      content: `You are Angela AI, an AI concierge for Angel Guides, a spiritual advisory platform.
      Your purpose is to guide users to the right spiritual advisors based on their needs.
      Be warm, empathetic, and speak with a calm, reassuring tone.
      Provide thoughtful, spiritual guidance while suggesting specific advisors when appropriate.
      If the user seems to be looking for an advisor, suggest starting the advisor matching process.
      
      Always respond in JSON format with a 'message' key containing your response text and an optional 'suggestions' array with 1-3 action items the user might want to take.`
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
