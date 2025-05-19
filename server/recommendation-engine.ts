import { AdvisorWithSpecialties, User, Specialty } from '@shared/schema';
import { callPerplexityAPI } from './perplexity';

/**
 * Interface for the recommendation result
 */
interface RecommendationResult {
  advisors: RecommendedAdvisor[];
  matchingCriteria: string[];
  additionalInsights: string;
}

/**
 * Interface for a recommended advisor with match score
 */
interface RecommendedAdvisor {
  advisor: AdvisorWithSpecialties;
  matchScore: number;
  matchReasons: string[];
  personalizedNote: string;
}

/**
 * Generate advanced recommendations for advisors based on user preferences
 * 
 * @param user The user to generate recommendations for
 * @param conversation The conversation history between the user and Angela AI
 * @param advisors The list of available advisors with their specialties
 * @param specialties The list of all specialties in the system
 * @returns An array of recommended advisors with match details
 */
export async function generateAdvancedRecommendations(
  user: User,
  conversation: any[],
  advisors: AdvisorWithSpecialties[],
  specialties: Specialty[]
): Promise<RecommendationResult> {
  try {
    // Extract meaningful details from the conversation
    const userResponses = conversation
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content);
    
    // Create a profile of the user based on their responses
    const userProfile = userResponses.join('\n');
    
    // Create a formatted list of advisors with their specialties
    const advisorsData = advisors.map(advisor => {
      // Get specialty names instead of just IDs
      const specialtyNames = (advisor.specialtiesList || [])
        .map(specialty => specialty.name)
        .join(', ');
      
      return {
        id: advisor.id,
        name: advisor.name,
        bio: advisor.bio || '',
        specialties: specialtyNames,
        chatRate: advisor.chatRate ? `$${(advisor.chatRate / 100).toFixed(2)}/min` : 'N/A',
        videoRate: advisor.videoRate ? `$${(advisor.videoRate / 100).toFixed(2)}/min` : 'N/A',
        audioRate: advisor.audioRate ? `$${(advisor.audioRate / 100).toFixed(2)}/min` : 'N/A',
        rating: advisor.rating || 0,
        reviewCount: advisor.reviewCount || 0
      };
    });

    // Structure prompt for the AI
    const messages = [
      {
        role: 'system',
        content: `You are an expert spiritual advisor matching algorithm. Your task is to analyze user responses and match them with the most suitable spiritual advisors. 
        
        Consider multiple dimensions when making matches:
        1. Spiritual needs alignment with advisor specialties
        2. Communication style preferences 
        3. Price sensitivity versus advisor rates
        4. Experience sought and advisor ratings
        5. Level of emotional support needed
        
        For each recommendation, provide specific reasons why the match is suitable along with a personalized note from the advisor to the user.
        
        Respond in valid JSON with the following structure:
        {
          "advisors": [
            {
              "id": number,
              "matchScore": number (0-100),
              "matchReasons": [array of strings explaining specific reasons why this advisor matches],
              "personalizedNote": string (a message from this advisor specifically addressing the user's needs)
            }
          ],
          "matchingCriteria": [array of strings describing what criteria were prioritized in making these matches],
          "additionalInsights": string (any additional spiritual insights based on the user's responses)
        }`
      },
      {
        role: 'user',
        content: `Here is information about a user seeking spiritual guidance:
        
        User profile based on conversation with Angela AI:
        ${userProfile}
        
        Available advisors:
        ${JSON.stringify(advisorsData, null, 2)}
        
        Please analyze this information and provide the most suitable advisor matches for this user, along with detailed match reasoning for each recommendation.`
      }
    ];

    // Call the Perplexity AI API with the recommendation prompt
    const responseJson = await callPerplexityAPI(messages, {
      model: 'llama-3.1-sonar-small-128k-online',
      temperature: 0.5,
      maxTokens: 1500,
      format: 'json'
    });

    // Parse the response
    const recommendations = JSON.parse(responseJson) as RecommendationResult;

    // Match the advisor IDs with the actual advisor data
    const enhancedRecommendations: RecommendationResult = {
      advisors: recommendations.advisors.map(rec => {
        // Find the full advisor data
        const advisorData = advisors.find(a => a.id === rec.id);
        
        if (!advisorData) {
          // Skip this recommendation if the advisor wasn't found
          return null as any;
        }
        
        return {
          advisor: advisorData,
          matchScore: rec.matchScore,
          matchReasons: rec.matchReasons,
          personalizedNote: rec.personalizedNote
        };
      }).filter(Boolean) as RecommendedAdvisor[],
      matchingCriteria: recommendations.matchingCriteria,
      additionalInsights: recommendations.additionalInsights
    };

    return enhancedRecommendations;
  } catch (error) {
    console.error('Error generating advanced recommendations:', error);
    // Return empty recommendations in case of error
    return {
      advisors: [],
      matchingCriteria: [],
      additionalInsights: 'Unable to generate recommendations at this time.'
    };
  }
}

/**
 * Get an explanation for why a particular advisor was recommended
 * 
 * @param user The user receiving the recommendation
 * @param advisor The recommended advisor
 * @param conversation The conversation history
 * @returns A detailed explanation for the recommendation
 */
export async function getRecommendationExplanation(
  user: User, 
  advisor: AdvisorWithSpecialties,
  conversation: any[]
): Promise<string> {
  try {
    // Extract user context from the conversation
    const userResponses = conversation
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n');
    
    // Format advisor specialties
    const specialtyNames = (advisor.specialtiesList || [])
      .map(specialty => specialty.name)
      .join(', ');
    
    // Create the prompt
    const messages = [
      {
        role: 'system',
        content: `You are Angela, an AI spiritual advisor working for Angelguides.ai. Your task is to explain why a specific spiritual advisor would be an excellent match for a user based on their conversation history. Be warm, intuitive, and specific about how the advisor's strengths address the user's spiritual needs.`
      },
      {
        role: 'user',
        content: `Based on my conversation with the user:
        
        "${userResponses}"
        
        I need to explain why ${advisor.name} would be an excellent spiritual advisor match. 
        
        Advisor details:
        - Specialties: ${specialtyNames}
        - Bio: ${advisor.bio || 'Not provided'}
        - Rating: ${advisor.rating || 'New advisor'}
        
        Please write a personalized, warm explanation (about 3-4 sentences) of why this advisor would be a good match based on the user's spiritual needs and the advisor's specific strengths.`
      }
    ];
    
    // Call Perplexity API for personalized explanation
    const explanation = await callPerplexityAPI(messages, {
      temperature: 0.7,
      maxTokens: 300
    });
    
    return explanation;
  } catch (error) {
    console.error('Error generating recommendation explanation:', error);
    return `${advisor.name} specializes in ${(advisor.specialtiesList || []).map(s => s.name).join(', ')} and would be a wonderful guide for your spiritual journey.`;
  }
}