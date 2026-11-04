import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is missing");
  process.exit(1);
}

console.log("✅ API key found");

const ai = new GoogleGenAI({
  apiKey
});

async function testGemini() {
  try {
    console.log("Testing Gemini...");
    console.log("Model: gemini-3.5-flash-lite");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: "Ask me one simple interview question for a software developer."
    });

    console.log("\n========== GEMINI RESPONSE ==========");
    console.log(response.text);
    console.log("=====================================\n");

  } catch (error) {
    console.error("\n========== GEMINI ERROR ==========");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    console.error("Full error:", error);
    console.error("==================================\n");
  }
}

testGemini();