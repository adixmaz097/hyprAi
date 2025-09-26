import { aiSearchTool } from "./aiSearch";

export async function getAIResponse(message, useSearch = true) {
  try {
    let searchContext = "";

    if (useSearch && message && message.trim() !== "") {
      searchContext = await aiSearchTool(message);
      if (!searchContext || searchContext.includes("No") || searchContext.includes("error")) {
        searchContext = "";
      } else if (searchContext.length > 800) {
        searchContext = searchContext.slice(0, 800); // truncate to prevent token issues
      }
    }

    const personalityPrompt = `
Your name is Hypr, an Advanced AI created by Hyprlyf Technologies.
Your primary goal is assist to users work.

Instructions:     
- You must speak users language.
- Provide a clear translation in your response.
- Then explain lesson.
- Do NOT repeat your introduction.
- Focus on the user's question or situation.
- Keep answers concise, clear, respectful, and practical.
User question or situation: {user_message}
Search context (if available): {search_context}
Hypr's response:

`;

    const fullMessage = personalityPrompt + "\n\n" + (searchContext
      ? message + "\n\nSearch Context:\n" + searchContext
      : message);

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) throw new Error("OpenRouter API key is missing");

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages: [{ role: "user", content: fullMessage }]
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const aiResponse = data?.choices?.[0]?.message?.content || "";

    return aiResponse.trim() || "I am here";

  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I'm a bit tired now. Let's take a 20-minute break, and then we can continue!";
  }
}
