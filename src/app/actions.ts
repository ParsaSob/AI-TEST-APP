
"use server";

import { generateAiResponse, type GenerateAiResponseOutput } from "@/ai/flows/generate-ai-response-flow";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface AIResponseData {
  aiResponse: string;
}

export async function handleSendMessage(
  userId: string,
  originalMessage: string
): Promise<AIResponseData | { error: string }> {
  if (!userId) {
    return { error: "User not authenticated." };
  }
  if (!originalMessage.trim()) {
    return { error: "Message cannot be empty." };
  }

  try {
    const aiResult: GenerateAiResponseOutput = await generateAiResponse({ message: originalMessage });

    if (!aiResult || !aiResult.response) {
      return { error: "AI failed to generate a response." };
    }
    
    await addDoc(collection(db, "user_messages"), { // Changed collection name
      user_id: userId,                            // Changed field name
      message_text: originalMessage,              // Changed field name
      response_text: aiResult.response,           // Changed field name
      timestamp: serverTimestamp(),
    });

    return {
      aiResponse: aiResult.response,
    };
  } catch (error) {
    console.error("Error handling message:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while processing your message.";
    return { error: `Failed to process message: ${errorMessage}` };
  }
}

