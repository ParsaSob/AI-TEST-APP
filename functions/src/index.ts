const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

exports.processMessage = functions.firestore
  .document("user_messages/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const messageText = data.message_text;

    // فراخوانی AI API
    const aiResponse = await getAIResponse(messageText);

    // به‌روزرسانی سند با پاسخ AI
    await snap.ref.update({
      response_text: aiResponse
    });
  });

async function getAIResponse(message) {
  const apiKey = "AIzaSyD7mn3QR4Bi_vqH7XcYqSImpB_zHLZlefQ";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  const response = await axios.post(
    `${url}?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: message }] }]
    }
  );
  return response.data.candidates[0].content.parts[0].text;
}