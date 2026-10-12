import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = 50;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
    const { senderId, body, isVoiceNote } = await req.json();

    if (!senderId || !body) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        body,
        isVoiceNote: isVoiceNote || false,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
