import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { updateMessageFeedback } from "../../../lib/db";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messageId, liked } = body;

    await updateMessageFeedback(messageId, liked);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating feedback:', error);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}