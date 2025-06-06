
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();

exports.processMessage = functions.firestore
  .document("user_messages/{docId}")
  .onCreate(async (snap: functions.firestore.QueryDocumentSnapshot, context: functions.EventContext<{ docId: string }>) => {
    const docId = context.params.docId;
    functions.logger.info(`[docId: ${docId}] Processing new message.`);

    const data = snap.data();
    if (!data) {
      functions.logger.error(`[docId: ${docId}] Document data is undefined.`);
      try {
        await snap.ref.update({ error_message: "Document data was empty or undefined." });
      } catch (e) { functions.logger.error(`[docId: ${docId}] Failed to write 'document data empty' error to Firestore`, e); }
      return;
    }

    const messageText = data.message_text;
    if (typeof messageText !== 'string' || !messageText.trim()) {
      functions.logger.error(`[docId: ${docId}] message_text is missing, not a string, or empty in document data.`, { data });
      try {
        await snap.ref.update({ error_message: "Message text was missing, invalid, or empty in document." });
      } catch (e) { functions.logger.error(`[docId: ${docId}] Failed to write 'message_text missing' error to Firestore`, e); }
      return;
    }

    functions.logger.info(`[docId: ${docId}] Message text: "${messageText}"`);

    try {
      const aiResponse = await getAIResponse(messageText, docId);
      functions.logger.info(`[docId: ${docId}] Received AI response: "${aiResponse}"`);
      await snap.ref.update({
        response_text: aiResponse,
        error_message: admin.firestore.FieldValue.delete() // Remove error message if successful
      });
      functions.logger.info(`[docId: ${docId}] Successfully updated Firestore with AI response.`);
    } catch (error: any) {
      functions.logger.error(`[docId: ${docId}] Error processing message and getting AI response:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      functions.logger.info(`[docId: ${docId}] Attempting to update Firestore with error message: "${errorMessage}"`);
      try {
        await snap.ref.update({
          error_message: "Failed to get AI response. Details: " + errorMessage
        });
        functions.logger.info(`[docId: ${docId}] Successfully updated Firestore with error message.`);
      } catch (updateError) {
        functions.logger.error(`[docId: ${docId}] CRITICAL: Failed to update Firestore with error message after an initial error:`, updateError);
      }
    }
  });

async function getAIResponse(message: string, docIdForLogging: string): Promise<string> {
  const apiKey = "AIzaSyD7mn3QR4Bi_vqH7XcYqSImpB_zHLZlefQ"; // Security risk: Hardcoded API key
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  
  functions.logger.info(`[docId: ${docIdForLogging}] Calling AI API at ${url} for message: "${message}"`);

  try {
    const response = await axios.post(
      `${url}?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: message }] }]
      },
      { timeout: 25000 } // 25-second timeout
    );

    functions.logger.info(`[docId: ${docIdForLogging}] Raw AI API response status: ${response.status}`);

    if (!response.data) {
        functions.logger.error(`[docId: ${docIdForLogging}] AI response data is undefined.`);
        throw new Error("AI response data was undefined.");
    }
    if (!response.data.candidates || !Array.isArray(response.data.candidates) || response.data.candidates.length === 0) {
      functions.logger.error(`[docId: ${docIdForLogging}] No candidates in AI response or candidates is not an array.`, { responseData: response.data });
      throw new Error("AI response did not contain valid candidates array.");
    }
    
    const candidate = response.data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts) || candidate.content.parts.length === 0) {
      functions.logger.error(`[docId: ${docIdForLogging}] No content or parts in AI candidate or parts is not an array.`, { candidate });
      throw new Error("AI response candidate did not contain valid content or parts array.");
    }
    
    const aiText = candidate.content.parts[0].text;
    if (typeof aiText !== 'string') {
        functions.logger.error(`[docId: ${docIdForLogging}] AI response part text is not a string.`, { part: candidate.content.parts[0] });
        throw new Error("AI response part text was not a string.");
    }
      
    functions.logger.info(`[docId: ${docIdForLogging}] Extracted AI text: "${aiText}"`);
    return aiText;

  } catch (error: any) {
    functions.logger.error(`[docId: ${docIdForLogging}] Error during AI API call:`, error.isAxiosError ? { message: error.message, code: error.code, config: error.config ? { url: error.config.url, method: error.config.method, timeout: error.config.timeout } : undefined, response: error.response ? { status: error.response.status, data: error.response.data } : undefined } : error);
    if (axios.isAxiosError(error)) {
      let detail = `AI API request failed: ${error.message}.`;
      if (error.response) {
        detail += ` Status: ${error.response.status}. Response: ${JSON.stringify(error.response.data)}.`;
      } else if (error.request) {
        detail += ` No response received from AI API. Code: ${error.code}.`;
      }
      throw new Error(detail);
    }
    throw new Error(`An unexpected error occurred in getAIResponse: ${error.message || String(error)}`);
  }
}
