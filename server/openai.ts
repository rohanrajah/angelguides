import OpenAI from "openai";
import { Specialty, User } from "@shared/schema";
import { callPerplexityAPI } from "./perplexity";

// Model selection constants 
const PRIMARY_MODEL = "gpt-3.5-turbo"; // More cost-effective model for regular chat
const ADVANCED_MODEL = "gpt-4o"; // More advanced model for final recommendations
const FALLBACK_MODEL = "gpt-3.5-turbo"; // Fallback if quota exceeded

// Provider selection flags - set to prefer Perplexity first
const USE_PERPLEXITY_FIRST = true; // Use Perplexity as the primary provider
const USE_OPENAI_FALLBACK = true;   // Use OpenAI as a fallback if Perplexity fails

// OpenAI client with error handling
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "demo-api-key"
});

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

// Predefined adaptive conversation templates based on different scenarios
// These are designed to create a more natural flowing conversation
const fallbackQuestions = [
  // First question - Core spiritual challenges and needs
  {
    message: "What specific spiritual challenges are you facing right now that have led you to seek guidance? Understanding your current situation will help me find an advisor who specializes in your unique needs.",
    questionNumber: 1,
    totalQuestions: 5,
    isMatchingQuestion: true
  },
  
  // Second question - Spiritual practices and modalities
  {
    message: "What spiritual practices or modalities do you feel most drawn to or curious about? For example: tarot, astrology, energy healing, mediumship, past life regression, or something else entirely?",
    questionNumber: 2,
    totalQuestions: 5,
    isMatchingQuestion: true
  },
  
  // Third question - Personal connection style
  {
    message: "When working with a spiritual advisor, what kind of connection style resonates with you most? Do you prefer someone who is compassionate and nurturing, direct and straightforward, analytical and detailed, or perhaps intuitive and visionary?",
    questionNumber: 3, 
    totalQuestions: 5,
    isMatchingQuestion: true
  },
  
  // Fourth question - Specific life areas needing guidance
  {
    message: "In which areas of your life are you specifically seeking spiritual insight? For instance: relationships, career path, personal growth, soul purpose, family matters, or healing from past experiences?",
    questionNumber: 4,
    totalQuestions: 5,
    isMatchingQuestion: true
  },
  
  // Fifth question - Timing and session preferences
  {
    message: "Are you looking for immediate guidance on a pressing matter, or ongoing spiritual support? And do you have a preference for how you'd like to connect with your advisor - through chat, audio calls, or video sessions?",
    questionNumber: 5,
    totalQuestions: 5,
    isMatchingQuestion: true
  }
];

export async function startAdvisorMatchingFlow(): Promise<MatchingQuestionResponse> {
  try {
    const systemInstruction = `You are Angela, an AI spiritual advisor matching assistant. 
      Your task is to help match users with the right spiritual advisor.
      Ask the user a question related to finding them the right spiritual advisor match.
      This is question 1 of 5 in the advisor matching flow.

      Please keep your response brief (1-2 sentences), clear, and conversational.
      
      Format your response as JSON with:
      - 'message': Your question text (focus on one specific aspect of what they're looking for)
      - 'questionNumber': 1
      - 'totalQuestions': 5
      - 'isMatchingQuestion': true`;
    
    // Try Perplexity first if enabled
    if (USE_PERPLEXITY_FIRST && process.env.PERPLEXITY_API_KEY) {
      try {
        console.log('[Angela] Using Perplexity for first matching question');
        
        const perplexityMessages = [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: "Create the first matching question to help me find the right spiritual advisor." }
        ];
        
        const perplexityResponse = await callPerplexityAPI(
          perplexityMessages as any,
          { format: 'json' }
        );
        
        return JSON.parse(perplexityResponse) as MatchingQuestionResponse;
      } catch (perplexityError) {
        console.error('[Angela] Perplexity error for first question:', perplexityError);
        
        // Fall back to OpenAI if configured
        if (USE_OPENAI_FALLBACK && process.env.OPENAI_API_KEY) {
          console.log('[Angela] Falling back to OpenAI for first matching question');
        } else {
          // If OpenAI fallback not enabled, use static fallback
          console.log("[Angela] Using fallback for first matching question");
          return fallbackQuestions[0];
        }
      }
    }
    
    // Try OpenAI if Perplexity not enabled or fallback to OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const systemMessage = {
          role: "system",
          content: systemInstruction
        };

        const response = await openai.chat.completions.create({
          model: PRIMARY_MODEL, // Use cost-effective model for initial questions
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
    } else {
      // Neither API is available, use fallback
      console.log("[Angela] No AI providers available, using fallback for first matching question");
      return fallbackQuestions[0];
    }
  } catch (error) {
    console.error("Unexpected error in startAdvisorMatchingFlow:", error);
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
      // Use a placeholder user object that matches User type requirements
      const dummyUser = {
        id: 1,
        username: "user",
        password: "password",
        name: "User",
        email: "user@example.com",
        phone: null,
        userType: "user",
        isAdvisor: false,
        avatar: null,
        bio: null,
        introVideo: null,
        specialties: [],
        chatRate: null,
        audioRate: null,
        videoRate: null,
        rating: null,
        reviewCount: null,
        availability: null,
        online: false,
        statusMessage: null,
        accountBalance: 0,
        earningsBalance: 0,
        totalEarnings: 0,
        pendingPayout: false,
        stripeCustomerId: null,
        stripeConnectId: null,
        firebaseUid: null,
        lastLogin: null,
        profileCompleted: false,
        birthDate: null,
        birthTime: null,
        birthPlace: null,
        vedicChart: null,
        humanDesignData: null
      };
      return await generateAdvisorRecommendations(dummyUser, conversationHistory);
    }
    
    // Create a system message with enhanced context
    const systemInstruction = `You are Angela AI, the spiritual advisor matching assistant for Angel Guides.
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
      - "isMatchingQuestion": true`;
    
    // Prepare conversation history
    const formattedConversation = conversationHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));

    // Try Perplexity first if enabled
    if (USE_PERPLEXITY_FIRST && process.env.PERPLEXITY_API_KEY) {
      try {
        console.log('[Angela] Using Perplexity for matching question', currentQuestionNumber + 1);
        
        // Format conversation history for Perplexity - ensuring alternating roles
        let perplexityMessages = [];
        
        // Add system message first
        perplexityMessages.push({
          role: 'system', 
          content: systemInstruction
        });
        
        // Ensure alternating roles in conversation history
        let lastRole = null;
        for (const msg of formattedConversation) {
          // Skip system messages - they should only be at the beginning
          if (msg.role === 'system') continue;
          
          const currentRole = msg.role === 'user' ? 'user' : 'assistant';
          
          // Skip consecutive messages with the same role
          if (currentRole === lastRole) continue;
          
          perplexityMessages.push({
            role: currentRole,
            content: msg.content
          });
          
          lastRole = currentRole;
        }
        
        // Make sure we end with a user message
        if (lastRole !== 'user' || perplexityMessages.length === 1) {  // Only system message
          perplexityMessages.push({
            role: 'user',
            content: "Please ask me the next question to help find the right spiritual advisor."
          });
        }
        
        console.log('[Angela] Formatted message history for matching question:', 
          perplexityMessages.map(m => `${m.role}: ${m.content.substring(0, 30)}...`));
        
        const perplexityResponse = await callPerplexityAPI(
          perplexityMessages as any,
          { format: 'json' }
        );
        
        return JSON.parse(perplexityResponse) as MatchingQuestionResponse;
      } catch (perplexityError) {
        console.error('[Angela] Perplexity error for matching question:', perplexityError);
        
        // Fall back to OpenAI if configured
        if (!USE_OPENAI_FALLBACK || !process.env.OPENAI_API_KEY) {
          // Use fallback if OpenAI not available
          console.log("[Angela] Using fallback for matching question");
          return fallbackQuestions[currentQuestionNumber] || {
            message: "Thank you for sharing that. As we continue to find the right advisor for you, I'm curious - how do you typically connect with spiritual guidance in your life? Have you worked with tools like tarot, meditation, or perhaps another practice that resonates with you?",
            questionNumber: currentQuestionNumber + 1,
            totalQuestions: 5,
            isMatchingQuestion: true
          };
        }
      }
    }
    
    // Try OpenAI if Perplexity not enabled or as fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('[Angela] Using OpenAI for matching question', currentQuestionNumber + 1);
        
        const systemMessage = {
          role: "system",
          content: systemInstruction
        };

        // Prepare conversation for OpenAI
        const messages = [
          systemMessage,
          ...formattedConversation
        ];

        const response = await openai.chat.completions.create({
          model: PRIMARY_MODEL, // Use cost-effective model for follow-up questions
          messages: messages as any[],
          response_format: { type: "json_object" },
          temperature: 0.8, // Slightly higher temperature for more variability
          max_tokens: 500
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          return JSON.parse(content) as MatchingQuestionResponse;
        } else {
          throw new Error("Empty response from OpenAI");
        }
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
    } else {
      // Neither API is available, use fallback
      console.log("[Angela] No AI providers available, using fallback for matching question");
      return fallbackQuestions[currentQuestionNumber] || {
        message: "Thank you for sharing that. As we continue to find the right advisor for you, I'm curious - how do you typically connect with spiritual guidance in your life? Have you worked with tools like tarot, meditation, or perhaps another practice that resonates with you?",
        questionNumber: currentQuestionNumber + 1,
        totalQuestions: 5,
        isMatchingQuestion: true
      };
    }
  } catch (error) {
    console.error("Unexpected error in getNextMatchingQuestion:", error);
    
    // Return the appropriate fallback question based on the current question number
    return fallbackQuestions[currentQuestionNumber] || {
      message: "Thank you for sharing that. As we continue to find the right advisor for you, I'm curious - how do you typically connect with spiritual guidance in your life?",
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
  user: User,
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
      - Elena Lovechild (ID: 5): Tarot expert with compassionate approach
      - David Wilson (ID: 6): Energy healer and spiritual coach, practical guidance
      - Sophia Rodriguez (ID: 7): Medium with focus on connecting with loved ones, empathetic
      - James Kim (ID: 8): Intuitive reader specializing in life path and career guidance`;
    }
    
    // Create system instructions for generating advisor recommendations
    const systemInstruction = `You are Angela AI, the advanced spiritual advisor matching assistant for Angel Guides.
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
      3. "suggestions": Array of 2-3 recommended next steps or questions the user might want to ask their advisor
      
      Make recommendations for exactly 3 advisors, unless the user has expressed a very clear preference that would narrow it to fewer options. Always prioritize relevance over diversity if the user is looking for something very specific.`;

    // Filter the most relevant messages to reduce token usage
    const relevantMessages = conversationHistory
      .filter(msg => 
        // Include all user messages, but only assistant messages that are part of the matching flow
        msg.role === "user" || isMatchingQuestion(msg.content)
      )
      .map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

    // Try Perplexity first if enabled
    if (USE_PERPLEXITY_FIRST && process.env.PERPLEXITY_API_KEY) {
      try {
        console.log('[Angela] Using Perplexity for advisor recommendations');
        
        // Format conversation history for Perplexity - ensuring alternating roles
        let perplexityMessages = [];
        
        // Add system message first
        perplexityMessages.push({
          role: 'system', 
          content: systemInstruction
        });
        
        // Ensure alternating roles in conversation history
        let lastRole = null;
        for (const msg of relevantMessages) {
          // Skip system messages - they should only be at the beginning
          if (msg.role === 'system') continue;
          
          const currentRole = msg.role === 'user' ? 'user' : 'assistant';
          
          // Skip consecutive messages with the same role
          if (currentRole === lastRole) continue;
          
          perplexityMessages.push({
            role: currentRole,
            content: msg.content
          });
          
          lastRole = currentRole;
        }
        
        // Make sure we end with a user message
        if (lastRole !== 'user' || perplexityMessages.length === 1) {  // Only system message
          perplexityMessages.push({
            role: 'user',
            content: "Based on our conversation, please recommend spiritual advisors that would be a good match for me."
          });
        }
        
        console.log('[Angela] Formatted message history for advisor recommendations:', 
          perplexityMessages.map(m => `${m.role}: ${m.content.substring(0, 30)}...`));
        
        const perplexityResponse = await callPerplexityAPI(
          perplexityMessages as any,
          { format: 'json' }
        );
        
        const recommendation = JSON.parse(perplexityResponse) as AdvisorRecommendation;
        
        // Validate the recommendation
        if (!recommendation.recommendedAdvisors || recommendation.recommendedAdvisors.length === 0) {
          recommendation.recommendedAdvisors = [5, 7, 8]; // Fallback to popular advisors
        }
        
        if (!recommendation.suggestions || recommendation.suggestions.length === 0) {
          recommendation.suggestions = [
            "Ask about their experience with your specific situation",
            "Inquire about their approach to spiritual guidance",
            "Share more details about what you're hoping to achieve"
          ];
        }
        
        return recommendation;
      } catch (perplexityError) {
        console.error('[Angela] Perplexity error for advisor recommendations:', perplexityError);
        
        // Fall back to OpenAI if configured
        if (!USE_OPENAI_FALLBACK || !process.env.OPENAI_API_KEY) {
          // Use fallback if OpenAI not available
          console.log("[Angela] Using fallback for advisor recommendations");
          return {
            message: "Based on our conversation, I believe these advisors would be a wonderful match for your spiritual journey. Each brings unique strengths that align with what you've shared with me.",
            recommendedAdvisors: [5, 7, 8], // Default to a diverse set of popular advisors
            suggestions: [
              "Ask about their experience with your specific situation",
              "Inquire about their approach to spiritual guidance",
              "Share more details about what you're hoping to achieve"
            ]
          };
        }
      }
    }
    
    // Try OpenAI if Perplexity not enabled or as fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('[Angela] Using OpenAI for advisor recommendations');
        
        const systemMessage = {
          role: "system",
          content: systemInstruction
        };

        // Prepare conversation for OpenAI
        const messages = [
          systemMessage,
          ...relevantMessages
        ];

        // Use GPT-4 for the final recommendation since this requires more complex reasoning
        const response = await openai.chat.completions.create({
          model: ADVANCED_MODEL, // Use the more advanced model for final recommendations
          messages: messages as any[],
          response_format: { type: "json_object" },
          temperature: 0.7, 
          max_tokens: 800 // Allow for longer response with detailed explanations
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          const recommendation = JSON.parse(content) as AdvisorRecommendation;
          
          // Ensure we have at least some advisor IDs and suggestions
          if (!recommendation.recommendedAdvisors || recommendation.recommendedAdvisors.length === 0) {
            recommendation.recommendedAdvisors = [5, 7, 8]; // Fallback to popular advisors
          }
          
          if (!recommendation.suggestions || recommendation.suggestions.length === 0) {
            recommendation.suggestions = [
              "Ask about their experience with your specific situation",
              "Inquire about their approach to spiritual guidance",
              "Share more details about what you're hoping to achieve"
            ];
          }
          
          return recommendation;
        } else {
          throw new Error("Empty response from OpenAI");
        }
      } catch (error: any) {
        console.error("Error generating advisor recommendations with OpenAI:", error);
        
        // Provide a fallback recommendation if needed
        return {
          message: "Based on our conversation, I believe these advisors would be a wonderful match for your spiritual journey. Each brings unique strengths that align with what you've shared with me.",
          recommendedAdvisors: [5, 7, 8], // Default to a diverse set of popular advisors
          suggestions: [
            "Ask about their experience with your specific situation",
            "Inquire about their approach to spiritual guidance",
            "Share more details about what you're hoping to achieve"
          ]
        };
      }
    } else {
      // Neither API is available, use fallback
      console.log("[Angela] No AI providers available, using fallback for advisor recommendations");
      return {
        message: "Based on our conversation, I believe these advisors would be a wonderful match for your spiritual journey. Each brings unique strengths that align with what you've shared with me.",
        recommendedAdvisors: [5, 7, 8], // Default to a diverse set of popular advisors
        suggestions: [
          "Ask about their experience with your specific situation",
          "Inquire about their approach to spiritual guidance",
          "Share more details about what you're hoping to achieve"
        ]
      };
    }
  } catch (error) {
    console.error("Unexpected error in generateAdvisorRecommendations:", error);
    
    // Provide a fallback recommendation
    return {
      message: "Based on our conversation, I believe these advisors would be a wonderful match for your spiritual journey. Each brings unique strengths that align with what you've shared with me.",
      recommendedAdvisors: [5, 7, 8], // Default to a diverse set of popular advisors
      suggestions: [
        "Ask about their experience with your specific situation",
        "Inquire about their approach to spiritual guidance",
        "Share more details about what you're hoping to achieve"
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
          
          RESPONSE FORMAT REQUIREMENT:
          Respond in JSON format with the following fields:
          - "message": Your empathetic, supportive response that addresses the user's message
          - "suggestions": Array of 2-3 gentle follow-up questions or suggestions to continue the conversation
          - "emotionalTone": The emotional tone of your message (e.g., "supportive", "empathetic", "compassionate", "encouraging")
          - "detectedEmotion": Your assessment of the primary emotion in the user's message (e.g., "anxiety", "hope", "confusion", "sadness")
          - "empathyLevel": A number from 1-5 indicating the level of empathy required in your response
        `
        : `You are Angela AI, a knowledgeable and supportive spiritual guidance assistant for the Angel Guides platform.
          Your role is to provide information, answer questions, and connect users with spiritual advisors.
          
          Focus on being helpful, friendly, and informative while maintaining a warm, conversational tone.
          Avoid being overly therapeutic or delving too deeply into personal emotional issues.
          
          RESPONSE FORMAT REQUIREMENT:
          Respond in JSON format with the following fields:
          - "message": Your helpful, informative response to the user's query
          - "suggestions": Array of 2-3 follow-up questions or suggestions to continue the conversation
          - "emotionalTone": The emotional tone of your message (e.g., "friendly", "informative", "encouraging")
          - "detectedEmotion": A simple assessment of the user's tone (e.g., "curious", "interested", "neutral")
          - "empathyLevel": A number from 1-5 indicating the level of empathy required in your response
        `
    };
    
    // Prepare conversation history for the AI
    const messages = [
      systemMessage,
      ...(conversationHistory.slice(-10).map(msg => ({
        role: msg.role as "user" | "assistant", 
        content: msg.content
      })) as any[]),
      { role: "user" as any, content: userMessage }
    ];

    // Choose the AI provider to use based on configuration
    if (USE_PERPLEXITY_FIRST && process.env.PERPLEXITY_API_KEY) {
      try {
        console.log('[Angela] Using Perplexity API as primary provider');
        
        // Format conversation history for Perplexity - ensuring alternating roles
        let perplexityMessages = [];
        
        // Add system message first
        perplexityMessages.push({
          role: 'system',
          content: 'You are Angela AI, a spiritual advisor assistant. Always respond in valid JSON format with fields: message, suggestions (array), emotionalTone, detectedEmotion, and empathyLevel (number 1-5).'
        });
        
        // Ensure alternating roles in conversation history
        let lastRole = null;
        for (const msg of messages.slice(0, -1)) { // Process all but the last message
          // Skip system messages - they should only be at the beginning
          if (msg.role === 'system') continue;
          
          const currentRole = msg.role === 'user' ? 'user' : 'assistant';
          
          // Skip consecutive messages with the same role
          if (currentRole === lastRole) continue;
          
          perplexityMessages.push({
            role: currentRole,
            content: msg.content
          });
          
          lastRole = currentRole;
        }
        
        // Always end with the user's message
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role !== 'user') {
          console.log('[Angela] Warning: Last message is not from user. Adding default user message.');
          perplexityMessages.push({
            role: 'user',
            content: 'Please provide spiritual guidance.'
          });
        } else {
          perplexityMessages.push({
            role: 'user',
            content: lastMessage.content
          });
        }
        
        console.log('[Angela] Formatted message history for Perplexity:', 
          perplexityMessages.map(m => `${m.role}: ${m.content.substring(0, 30)}...`));
        
        // Call Perplexity API
        const perplexityResponse = await callPerplexityAPI(
          perplexityMessages as any,
          { format: 'json' }
        );
        
        // Parse the Perplexity response
        return JSON.parse(perplexityResponse) as AngelaResponse;
      } 
      catch (perplexityError: any) {
        console.error('[Angela] Perplexity primary provider failed:', perplexityError);
        
        // Fall back to OpenAI if enabled
        if (USE_OPENAI_FALLBACK && process.env.OPENAI_API_KEY) {
          try {
            console.log('[Angela] Falling back to OpenAI');
            const response = await openai.chat.completions.create({
              model: PRIMARY_MODEL,
              messages: messages as any[],
              response_format: { type: "json_object" },
              temperature: 0.7,
              max_tokens: 500
            });

            const content = response.choices[0]?.message?.content;
            if (content) {
              return JSON.parse(content) as AngelaResponse;
            }
            throw new Error("Empty response from OpenAI");
          }
          catch (openaiError: any) {
            console.error('[Angela] OpenAI fallback failed:', openaiError.message);
            // Continue to static fallback
          }
        }
      }
    } 
    else if (process.env.OPENAI_API_KEY) {
      // Try OpenAI as primary if Perplexity is not configured as primary
      try {
        console.log('[Angela] Using OpenAI as primary provider');
        const response = await openai.chat.completions.create({
          model: PRIMARY_MODEL,
          messages: messages as any[],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 500
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          return JSON.parse(content) as AngelaResponse;
        }
        throw new Error("Empty response from OpenAI");
      }
      catch (openaiError: any) {
        console.error('[Angela] OpenAI primary provider failed:', openaiError.message);
        
        // Fall back to Perplexity if enabled
        if (process.env.PERPLEXITY_API_KEY) {
          try {
            console.log('[Angela] Falling back to Perplexity');
            
            // Format conversation history for Perplexity - ensuring alternating roles
            let perplexityMessages = [];
            
            // Add system message first
            perplexityMessages.push({
              role: 'system',
              content: 'You are Angela AI, a spiritual advisor assistant. Always respond in valid JSON format with fields: message, suggestions (array), emotionalTone, detectedEmotion, and empathyLevel (number 1-5).'
            });
            
            // Ensure alternating roles in conversation history
            let lastRole = null;
            for (const msg of messages.slice(0, -1)) { // Process all but the last message
              // Skip system messages - they should only be at the beginning
              if (msg.role === 'system') continue;
              
              const currentRole = msg.role === 'user' ? 'user' : 'assistant';
              
              // Skip consecutive messages with the same role
              if (currentRole === lastRole) continue;
              
              perplexityMessages.push({
                role: currentRole,
                content: msg.content
              });
              
              lastRole = currentRole;
            }
            
            // Always end with the user's message
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role !== 'user') {
              console.log('[Angela] Warning: Last message is not from user. Adding default user message.');
              perplexityMessages.push({
                role: 'user',
                content: 'Please provide spiritual guidance.'
              });
            } else {
              perplexityMessages.push({
                role: 'user',
                content: lastMessage.content
              });
            }
            
            console.log('[Angela] Formatted message history for Perplexity (fallback):', 
              perplexityMessages.map(m => `${m.role}: ${m.content.substring(0, 30)}...`));
            
            // Call Perplexity API
            const perplexityResponse = await callPerplexityAPI(
              perplexityMessages as any,
              { format: 'json' }
            );
            
            // Parse the Perplexity response
            return JSON.parse(perplexityResponse) as AngelaResponse;
          }
          catch (perplexityError: any) {
            console.error('[Angela] Perplexity fallback failed:', perplexityError);
            // Continue to static fallback
          }
        }
      }
    }
    
    // If we get here, both providers failed or weren't configured
    // Use a static fallback response with appropriate message
    const missingPerplexity = !process.env.PERPLEXITY_API_KEY;
    const missingOpenAI = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "demo-api-key";
    
    let fallbackMessage;
    if (missingPerplexity && missingOpenAI) {
      fallbackMessage = "I sense that my connection to the spiritual realm is incomplete. My abilities require a valid mystical conduit (API key) to channel the full wisdom you seek.";
    } else {
      fallbackMessage = "The cosmic energies are at capacity right now. My spiritual guides suggest we pause briefly before continuing our journey together.";
    }
    
    return {
      message: fallbackMessage,
      emotionalTone: "supportive",
      detectedEmotion: "neutral",
      empathyLevel: 3,
      suggestions: [
        "Try asking another question to reconnect our spiritual energies",
        "Explore our advisor profiles to find a spiritual guide",
        "Return in a few moments when the cosmic alignment is stronger"
      ]
    };
  } catch (error: any) {
    console.error("Unexpected error in getAngelaResponse:", error);
    
    return {
      message: "The connection between our realms seems unstable. Let's try to reconnect in a moment when the spiritual channels are clearer.",
      emotionalTone: "supportive",
      detectedEmotion: "neutral",
      empathyLevel: 3,
      suggestions: [
        "Try rephrasing your question in a different way",
        "Explore our advisor profiles to find a spiritual guide",
        "Take a moment to reflect and return when you feel ready"
      ]
    };
  }
}