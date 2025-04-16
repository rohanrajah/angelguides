import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "demo-api-key" });

export interface AngelaResponse {
  message: string;
  suggestions?: string[];
}

export async function getAngelaResponse(
  userMessage: string, 
  conversationHistory: { role: string; content: string }[]
): Promise<AngelaResponse> {
  try {
    // Create a system message for Angela AI
    const systemMessage = {
      role: "system",
      content: `You are Angela, an AI concierge for Ethereal Advisors, a spiritual advisory platform.
      Your purpose is to guide users to the right spiritual advisors based on their needs.
      Be warm, empathetic, and speak with a calm, reassuring tone.
      Provide thoughtful, spiritual guidance while suggesting specific advisors when appropriate.
      Always respond in JSON format with a 'message' key containing your response text and an optional 'suggestions' array with 1-3 action items the user might want to take.`
    };

    // Prepare conversation for OpenAI
    const messages = [
      systemMessage,
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      { role: "user", content: userMessage }
    ];

    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
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
