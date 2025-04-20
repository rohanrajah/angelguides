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
    /help connect you with the perfect spiritual advisor/i,
    /match you with someone who truly resonates/i,
    /understand what brings you here/i,
    /find your ideal match/i,
    /perfect advisor for your needs/i,
    /understand your spiritual journey/i,
    /match you with the right advisor/i,
    /love, career, or spiritual growth/i,
    /decision-making style/i,
    /spiritual tools/i,
    /tarot, astrology, or energy healing/i,
    /advisor communication style/i,
    /long-term guidance or quick insights/i
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

// Predefined fallback questions for when OpenAI is unavailable
const fallbackQuestions = [
  {
    message: "I'd love to connect you with the perfect spiritual advisor who resonates with your unique journey. Everyone's spiritual path is different, and finding the right guide can make all the difference. What brings you to seek spiritual guidance today? Feel free to share as much or as little as you're comfortable with.",
    questionNumber: 1,
    totalQuestions: 5,
    isMatchingQuestion: true
  },
  {
    message: "Thank you for sharing that. To help find the perfect match, I'm curious about how you typically approach important decisions in your life. Do you tend to follow your intuition, analyze all the options, or perhaps a combination of both?",
    questionNumber: 2,
    totalQuestions: 5,
    isMatchingQuestion: true
  },
  {
    message: "I appreciate your thoughtful response. Are you looking for guidance on a specific immediate concern, or are you more interested in ongoing support for your spiritual journey and development?",
    questionNumber: 3, 
    totalQuestions: 5,
    isMatchingQuestion: true
  },
  {
    message: "Thank you for sharing that. How do you feel about different spiritual tools and practices like tarot, astrology, energy healing, or meditation? Are there any you're particularly drawn to or curious about?",
    questionNumber: 4,
    totalQuestions: 5,
    isMatchingQuestion: true
  },
  {
    message: "We're almost done finding your perfect match. Finally, what kind of communication style do you connect with best? Do you prefer someone who is direct and straightforward, warm and nurturing, or perhaps analytical and detailed?",
    questionNumber: 5,
    totalQuestions: 5,
    isMatchingQuestion: true
  }
];

export async function startAdvisorMatchingFlow(): Promise<MatchingQuestionResponse> {
  try {
    // Try to get a personalized first question from OpenAI
    const systemMessage = {
      role: "system",
      content: `You are Angela, an AI spiritual advisor matching assistant. 
      Your task is to help match users with the right spiritual advisor.
      Ask the user a question related to finding them the right spiritual advisor match.
      This is question 1 of 5 in the advisor matching flow.

      Please keep your response brief (1-2 sentences), clear, and conversational.
      
      Format your response as JSON with:
      - 'message': Your question text (focus on one specific aspect of what they're looking for)
      - 'questionNumber': 1
      - 'totalQuestions': 5
      - 'isMatchingQuestion': true
      `
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [systemMessage as any],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 250
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as MatchingQuestionResponse;
    } else {
      throw new Error("Empty response from OpenAI");
    }
  } catch (error: any) {
    if (error?.response?.status === 429) {
      console.error("OpenAI API rate limit exceeded. Using fallback for first matching question.");
    } else {
      console.error("Error starting matching flow:", error);
    }
    
    console.log("[Angela] Using fallback for first matching question");
    // Return the first fallback question
    return fallbackQuestions[0];
  }
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
    
    // Create a system message for Angela AI as matching assistant with enhanced context
    const systemMessage = {
      role: "system",
      content: `You are Angela AI, the spiritual advisor matching assistant for Angel Guides.
      You're currently in the process of asking a user questions to match them with the perfect spiritual advisor.
      This is question ${currentQuestionNumber + 1} of 5.
      You're having a natural, flowing conversation with the user to understand their needs for spiritual guidance.
      
      CONVERSATION FLOW GUIDELINES:
      - Make the conversation feel natural and empathetic, not like a survey
      - Start with broad questions and narrow down based on their responses
      - Show genuine curiosity about their spiritual journey
      - Adapt your questions based on what they've already shared
      - Use a warm, supportive tone throughout
      
      Based on the conversation so far, ask your next question in a conversational way, making sure to cover these 5 key areas (if not already addressed):
      
      QUESTION AREAS (DON'T EXPLICITLY MENTION THESE TO THE USER):
      1. PRIMARY CONCERN: Their reason for seeking guidance (love, career, spiritual growth, life purpose, etc.)
        - If they mention love, ask about the specific relationship challenge
        - If they mention career, ask about their dream job or current obstacles
        - If they mention spiritual growth, ask what aspects they're looking to develop
        
      2. DECISION-MAKING STYLE: How they prefer to approach decisions (intuition, logic, gut feeling, etc.)
        - Ask how they usually make important life choices
        - Determine if they're analytical or intuitive in their approach
        - Understand if they prefer direct guidance or exploring options
        
      3. TIMEFRAME & DEPTH: Whether they want long-term guidance or quick insights
        - Ask if they're looking for ongoing support or help with a specific issue
        - Determine if they prefer deep spiritual work or practical advice
        - Understand their time expectations for seeing results
        
      4. SPIRITUAL TOOLS: Their comfort and interest in different spiritual practices
        - Ask about their previous experience with tarot, astrology, energy healing, etc.
        - Determine which tools they find most resonant or are curious about
        - Understand if they have any hesitations about certain practices
        
      5. COMMUNICATION STYLE: What advisor approach they connect with best
        - Ask if they prefer direct communication or a gentler approach
        - Determine if they want an advisor who is warm, analytical, spiritual, or practical
        - Understand if they prefer structured sessions or a more fluid conversation
      
      Make your questions feel like a natural flowing conversation. Acknowledge their previous answer with empathy before asking the next question.
      
      Respond in JSON format with: 
      - "message": Your conversational response that both acknowledges their previous answer and asks the next question
      - "questionNumber": ${currentQuestionNumber + 1}
      - "totalQuestions": 5
      - "isMatchingQuestion": true`
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
      temperature: 0.8, // Slightly higher temperature for more variability
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content || '{"message": "I appreciate you sharing that with me. To help find the perfect advisor for your journey, I\'d love to understand a bit more about how you typically approach important decisions in your life. Do you tend to follow your intuition, analyze all the options, or perhaps a combination of both?", "questionNumber": 1, "totalQuestions": 5, "isMatchingQuestion": true}';
    return JSON.parse(content) as MatchingQuestionResponse;
  } catch (error: any) {
    if (error?.response?.status === 429) {
      console.error("OpenAI API rate limit exceeded. Using fallback question.");
    } else {
      console.error("Error getting next matching question:", error);
    }
    
    // Return the appropriate fallback question based on the current question number
    return fallbackQuestions[currentQuestionNumber] || {
      message: "Thank you for sharing that. As we continue to find the right advisor for you, I'm curious - how do you typically connect with spiritual guidance in your life? Have you worked with tools like tarot, meditation, or perhaps another practice that resonates with you?",
      questionNumber: currentQuestionNumber + 1,
      totalQuestions: 5,
      isMatchingQuestion: true
    };
  }
}

export interface AdvisorWithSpecialties extends User {
  specialtiesList?: Specialty[];
}

export async function generateAdvisorRecommendations(
  conversationHistory: { role: string; content: string }[],
  advisors?: AdvisorWithSpecialties[],
  specialties?: Specialty[]
): Promise<AdvisorRecommendation> {
  try {
    // First create dynamic advisor information based on the database
    let advisorInfo = "";
    
    if (advisors && advisors.length > 0) {
      advisorInfo = "Available advisors:\n";
      
      for (const advisor of advisors) {
        const specialtiesText = advisor.specialtiesList 
          ? advisor.specialtiesList.map(s => s.name).join(", ")
          : "Various specialties";
          
        advisorInfo += `- ${advisor.name} (ID: ${advisor.id}): ${specialtiesText}. `;
        
        if (advisor.bio) {
          // Add a short version of the bio if available
          const shortBio = advisor.bio.length > 100 
            ? advisor.bio.substring(0, 100) + "..." 
            : advisor.bio;
          advisorInfo += shortBio;
        }
        
        if (advisor.rating) {
          advisorInfo += ` Rating: ${advisor.rating}/5 from ${advisor.reviewCount || 0} reviews.`;
        }
        
        advisorInfo += "\n";
      }
    } else {
      // Fallback if no advisors are provided
      advisorInfo = `Available advisor IDs are: 4, 5, 6, 7, 8 (use these exact numbers)
      - Michael Chen (ID: 4): Astrology specialist with direct, analytical style
      - Elena Patel (ID: 5): Tarot expert with compassionate approach
      - David Wilson (ID: 6): Energy healer and spiritual coach, practical guidance
      - Sophia Rodriguez (ID: 7): Medium with focus on connecting with loved ones, empathetic
      - James Kim (ID: 8): Intuitive reader specializing in life path and career guidance`;
    }
    
    // Create a system message for generating advisor recommendations
    const systemMessage = {
      role: "system",
      content: `You are Angela AI, the advanced spiritual advisor matching assistant for Angel Guides.
      Your task is to analyze the conversation history and determine the user's unique needs, preferences,
      and spiritual journey to recommend the most compatible spiritual advisors.
      
      ${advisorInfo}
      
      ADVANCED MATCHING ALGORITHM CRITERIA:
      1. Match based on the user's primary concern (love, career, spiritual growth, healing, etc.)
      2. Analyze the user's communication style (direct, reflective, emotional, analytical) and match with compatible advisors
      3. Evaluate the user's comfort level with different spiritual practices and modalities
      4. Determine if the user wants long-term guidance or quick insights, and match accordingly
      5. Consider the user's emotional state and match with advisors who have the appropriate approach
      6. Factor in advisor specialties, expertise areas, and approach style
      7. Use ratings and reviews (when available) as secondary factors
      8. Consider how the advisor's bio and communication style would resonate with this specific user
      
      PERSONALIZATION REQUIREMENTS:
      - Be highly specific about WHY each advisor is recommended, citing exact details from the conversation
      - Highlight how each advisor's unique strengths address the user's specific needs
      - When possible, match the vocabulary and tone used by the user
      - Acknowledge any hesitations or specific requirements mentioned by the user
      - Vary your recommendations to ensure diversity of approaches unless user has expressed very specific preferences
      
      Respond in JSON format with:
      1. "message": A warm, personalized explanation of why these advisors would be a good match, 
         mentioning specific points from the conversation and highlighting the unique benefits of each advisor
      2. "recommendedAdvisors": Array of advisor IDs you recommend (e.g., [5, 7, 8])
      3. "suggestions": Array of 2-3 specific next steps the user could take to explore these recommendations`
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
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content || '{"message": "Based on our conversation, I recommend connecting with Elena Patel, who specializes in tarot readings with a compassionate approach, and Sophia Rodriguez, who is an empathetic medium focused on connecting with loved ones. They both seem well-aligned with your spiritual needs.", "recommendedAdvisors": [5, 7], "suggestions": ["Browse Elena\'s profile to see her availability", "Read reviews from Sophia\'s past clients", "Book a short initial session to see if there\'s a connection"]}';
    return JSON.parse(content) as AdvisorRecommendation;
  } catch (error: any) {
    if (error?.response?.status === 429) {
      console.error("OpenAI API rate limit exceeded. Using fallback advisor recommendations.");
    } else {
      console.error("Error generating advisor recommendations:", error);
    }
    
    // Use advisors provided from database if available, otherwise use fallback
    const defaultAdvisorIds = [5, 7, 4];
    const recommendedIds = advisors && advisors.length >= 3 
      ? advisors.slice(0, 3).map(advisor => advisor.id) 
      : defaultAdvisorIds;
    
    console.log(`[Angela] Using fallback recommendation for advisors: ${recommendedIds.join(', ')}`);
    
    return {
      message: "Based on our conversation, I have three excellent recommendations for you. Elena Patel specializes in tarot readings with a compassionate, intuitive approach that can help illuminate your path forward. Sophia Rodriguez is a gifted medium who creates a warm, empathetic space for spiritual connection. And Michael Chen offers insightful astrological guidance to understand the cosmic influences in your life. Each of these advisors brings unique strengths that align well with the questions you've shared.",
      recommendedAdvisors: recommendedIds,
      suggestions: [
        "Browse each advisor's full profile to see their detailed specialties and approach",
        "Read recent reviews to see how they've helped others with similar concerns",
        "Book a short initial session to feel their energy and determine the best connection"
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
      console.log(`[Angela] Continuing advisor matching flow. Question #${currentQuestionNumber} of 5.`);
      return await getNextMatchingQuestion(userMessage, conversationHistory, currentQuestionNumber);
    }
    
    // Check for keywords to start the matching flow
    const matchingKeywords = [
      "find advisor", "match me", "recommend advisor", "which advisor", 
      "best advisor", "find psychic", "need guidance", "connect me", "match advisor",
      "help me find", "looking for an advisor", "spiritual advisor", "consultation",
      "want to talk to", "speak with someone", "guidance for", "right fit",
      "who should I", "seek advice", "expert in", "professional guidance", "advisor match"
    ];
    
    if (matchingKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      console.log(`[Angela] Starting new advisor matching flow.`);
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
  } catch (error: any) {
    if (error?.response?.status === 429) {
      console.error("OpenAI API rate limit exceeded. Using fallback response.");
    } else {
      console.error("Error getting Angela response:", error);
    }
    
    return {
      message: "I apologize, but I'm experiencing a connection issue with the spiritual realm right now. Please try again in a moment.",
      emotionalTone: "supportive",
      detectedEmotion: "neutral",
      empathyLevel: 3,
      suggestions: [
        "Try phrasing your question differently",
        "Come back in a little while when our connection is stronger",
        "Explore our advisor profiles directly"
      ]
    };
  }
}
