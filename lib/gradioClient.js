// lib/gradioClient.js - PERMANENT SEARCH REQUIRED + Top-2 Truncated Context
import { Client } from "@gradio/client";
import { aiSearchTool } from './aiSearch'; // ✅ Search tool import

// ---------------- Helper to truncate text ----------------
function truncateText(text, maxLength = 800) {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

// ---------------- Main sendMessage Function ----------------
export async function sendMessage(message) {
  console.log("🔵 AI with MANDATORY Search");
  
  try {
    console.log("🔍 Mandatory search for:", message);
    const rawContextFull = await aiSearchTool(message);

    // 1. ✅ If search fails
    if (!rawContextFull || rawContextFull.trim() === "" || rawContextFull.includes("No search") || rawContextFull.includes("unavailable")) {
      console.warn("❌ Search failed or no results found");
      return {
        response: "I apologize, I couldn't find any relevant information to answer your question. Please try a different question or try again later.",
        sources: []
      };
    }

    // 2. ✅ Keep only first 2 sources
    const topSources = rawContextFull.split("\n").slice(0, 2).join("\n");

    // 3. ✅ Truncate to safe length for model
    const searchContext = truncateText(topSources, 800);

    // 4. ✅ Connect to Gradio AI
    const app = await Client.connect("Hyprlyf/hypr1");

    // 5. ✅ STRICT PROMPT (unchanged)
    const prompt = `
IMPORTANT: You MUST use the search results below to answer the user's question.
If the search results don't contain the answer, say "I don't have enough information".

SEARCH RESULTS:
${searchContext}

USER QUESTION: ${message}

FACTUAL RESPONSE BASED ON SEARCH RESULTS:`;

    console.log("🤖 Sending to AI with truncated top-2 search context...");

    const result = await app.predict("/predict", [prompt]);
    const aiResponse = result?.data?.[0] || "I couldn't generate a response based on the search results.";

    if (isResponseEmptyOrError(aiResponse)) {
      return {
        response: "I couldn't find sufficient information to answer your question properly. Please try another question.",
        sources: ["Search attempted but insufficient results"]
      };
    }

    return {
      response: aiResponse,
      sources: ["Web search results used (top 2 URLs only)"]
    };
    
  } catch (error) {
    console.error('Error in mandatory search flow:', error);
    return {
      response: "I'm currently unable to search for information. Please try again later.",
      sources: []
    };
  }
}

// ✅ Helper function to check if response is useless
function isResponseEmptyOrError(response) {
  if (!response) return true;
  const text = response.toLowerCase();
  return text.includes("i don't have") || 
         text.includes("no information") ||
         text.includes("couldn't find") ||
         text.length < 20 ||
         text === "i couldn't generate a response based on the search results.";
}
