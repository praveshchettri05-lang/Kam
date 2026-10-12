import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params;
    const { workerId } = await req.json();

    if (!workerId) {
      return NextResponse.json({ success: false, error: 'workerId is required' }, { status: 400 });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        workerId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
