
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
  console.log("[Action] handleSendMessage called with userId:", userId);

  if (!db) {
    console.error("[Action] Firestore database instance (db) is not available in handleSendMessage.");
    return { success: false, error: "Database not initialized. Critical error. Please contact support." };
  }
  console.log("[Action] Firestore db object seems to be initialized.");

  if (!userId) {
    console.warn("[Action] userId is missing in handleSendMessage.");
    return { success: false, error: "User not authenticated." };
  }

  if (!originalMessage || !originalMessage.trim()) {
    console.warn("[Action] originalMessage is empty in handleSendMessage.");
    return { success: false, error: "Message cannot be empty." };
  }

  const trimmedMessage = originalMessage.trim();
  console.log("[Action] Attempting to save message to Firestore. Trimmed message length:", trimmedMessage.length);

  try {
    const docData = {
      user_id: userId,
      message_text: trimmedMessage,
      timestamp: serverTimestamp(),
    };
    console.log("[Action] Data to be sent to Firestore:", JSON.stringify(docData, null, 2));

    const docRef: DocumentReference<DocumentData> = await addDoc(collection(db, "user_messages"), docData);

    console.log(`[Action] Message successfully written to Firestore. Doc ID: ${docRef.id}, User ID: ${userId}`);
    return {
      success: true,
      docId: docRef.id,
    };
  } catch (error: any) {
    console.error("[Action] Error saving message to Firestore in handleSendMessage:", error);
    console.error("[Action] Error Name:", error.name);
    console.error("[Action] Error Code:", error.code);
    console.error("[Action] Error Message:", error.message);
    console.error("[Action] Error Stack:", error.stack);
    
    let errorMessage = "We couldn't save your message. Please try again later.";
    if (error.code) {
      errorMessage += ` (Error Code: ${error.code})`;
    } else if (error.message) {
      errorMessage += ` (Details: ${error.message})`;
    }
    return { success: false, error: errorMessage };
  }
}
