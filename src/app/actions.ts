"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, type DocumentReference, type DocumentData } from "firebase/firestore";

interface HandleSendMessageResult {
  success: boolean;
  docId?: string;
  error?: string;
}

export async function handleSendMessage(
  userId: string,
  originalMessage: string
): Promise<HandleSendMessageResult> {
  if (!db) {
    return { success: false, error: "Database not initialized." };
  }

  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  if (!originalMessage.trim()) {
    return { success: false, error: "Message cannot be empty." };
  }

  if (originalMessage.length > 1000) {
    return { success: false, error: "Message is too long. Maximum length is 1000 characters." };
  }

  // The UUID validation was removed from here as Firebase UIDs are not necessarily UUIDs.

  try {
    const docRef: DocumentReference<DocumentData> = await addDoc(collection(db, "user_messages"), {
      user_id: userId,
      message_text: originalMessage.trim(), // پاکسازی پیام
      timestamp: serverTimestamp(),
    });

    return {
      success: true,
      docId: docRef.id,
    };
  } catch (error) {
    console.error("Error saving message to Firestore:", error);
    return { success: false, error: "We couldn't save your message. Please try again later." };
  }
}
