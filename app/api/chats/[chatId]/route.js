import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getChatMessages } from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  // ✅ Pehle params ko await karo
  const { chatId } = await params;

  // Method check (optional in App Router)
  if (request.method !== 'GET') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // ✅ chatId ko number mein convert karo
    const numericChatId = parseInt(chatId, 10);
    
    // ✅ Validate karo ki number hai
    if (isNaN(numericChatId)) {
      return NextResponse.json(
        { error: 'Invalid chat ID format' },
        { status: 400 }
      );
    }
    
    // ✅ Number bhejo getChatMessages function ko
    const messages = await getChatMessages(numericChatId);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}