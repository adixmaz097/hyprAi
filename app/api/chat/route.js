import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { storeMessage, createChat, getChatHistory } from "../../../lib/db";
import { getAIResponse } from "@/lib/ai"; // ✅ Use ai.js only

// ✅ Response cleaning function
function cleanAIResponse(response) {
  if (!response) return "Hello! How can I help you today?";
  let cleaned = typeof response === 'string' ? response : String(response);

  cleaned = cleaned
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```thinking[\s\S]*?```/gi, "")
    .replace(/###.*?###/gs, "")
    .replace(/analysis[:\-]?/gi, "")
    .replace(/<\|im_end\|>/g, "")
    .replace(/<\|im_start\|>/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\*\*/g, "")
    .trim();

  return cleaned || "Hello! How can I help you today?";
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { message, chatId } = await req.json();
    const userId = session.user.id;

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let currentChatId = chatId;
    if (!currentChatId) {
      currentChatId = await createChat(
        userId,
        message.substring(0, 50),
        {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }
      );
    }

    // Store user message
    await storeMessage(currentChatId, userId, "user", message);

    // Special greeting
    if (/^hello Hypr$/i.test(message.trim())) {
      const greetingResponse = "Hello! I'm Hypr, your AI assistant. How can I help you today?";
      await storeMessage(currentChatId, userId, "assistant", greetingResponse);

      return new Response(
        JSON.stringify({ response: greetingResponse, chatId: currentChatId }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get chat history for context
    const history = await getChatHistory(currentChatId);
    let context = "";
    if (history && history.length > 0) {
      context = history.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
    }

    // ✅ Get AI response from ai.js
    let aiResponse = await getAIResponse(message, context);
    const cleanedResponse = cleanAIResponse(aiResponse);

    // Store AI response
    await storeMessage(currentChatId, userId, "assistant", cleanedResponse);

    return new Response(
      JSON.stringify({ response: cleanedResponse, chatId: currentChatId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ✅ OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
