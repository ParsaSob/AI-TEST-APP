
"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, type DocumentReference } from "firebase/firestore";

interface HandleSendMessageResult {
  success: boolean;
  docId?: string;
  error?: string;
}

export async function handleSendMessage(
  userId: string,
  originalMessage: string
): Promise<HandleSendMessageResult> {
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }
  if (!originalMessage.trim()) {
    return { success: false, error: "Message cannot be empty." };
  }

  try {
    // The AI response will be added by the Firebase Function
    const docRef: DocumentReference = await addDoc(collection(db, "user_messages"), {
      user_id: userId,
      message_text: originalMessage,
      timestamp: serverTimestamp(),
      // response_text will be populated by the Firebase Function
    });

    return {
      success: true,
      docId: docRef.id,
    };
  } catch (error) {
    console.error("Error saving message to Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while saving your message.";
    return { success: false, error: `Failed to save message: ${errorMessage}` };
  }
}
