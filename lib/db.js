import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureUserExists(userId, userData = {}) {
  try {
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name: userData.name || '',
          email: userData.email || '',
          image: userData.image || '',
        },
      });
      console.log('New user created:', userId);
    }
    return user;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
}

// नया chat बनाओ
export async function createChat(userId, title, userData = {}) {
  try {
    await ensureUserExists(userId, userData);

    const chat = await prisma.chat.create({
      data: {
        userId,
        title,
      },
    });

    return chat.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
}

// message save करो
export async function storeMessage(chatId, userId, role, content) {
  try {
    await prisma.message.create({
      data: {
        chatId,
        userId,
        role,
        content,
      },
    });
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
}

// किसी chat का history निकालो
export async function getChatHistory(chatId, limit = 10) {
  return await prisma.message.findMany({
    where: { chatId },
    orderBy: { timestamp: 'asc' },
    take: limit,
    select: {
      role: true,
      content: true,
    },
  });
}

// किसी user के सारे chats लाओ
export async function getUserChats(userId) {
  const chats = await prisma.chat.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    include: {
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 1,
        select: { content: true },
      },
    },
  });

  return chats.map(chat => ({
    id: chat.id,
    title: chat.title,
    timestamp: chat.timestamp,
    last_message: chat.messages[0]?.content || null,
  }));
}

// किसी chat के सारे messages निकालो
export async function getChatMessages(chatId) {
  return await prisma.message.findMany({
    where: { chatId },
    orderBy: { timestamp: 'asc' },
    select: {
      id: true,
      role: true,
      content: true,
      timestamp: true,
      liked: true,
    },
  });
}

// किसी message पर feedback update करो
export async function updateMessageFeedback(messageId, liked) {
  await prisma.message.update({
    where: { id: messageId },
    data: { liked },
  });
}