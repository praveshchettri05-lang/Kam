import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, user: null });
  }
  // Mocking auth middleware for now
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Mock user
    const currentUser = await prisma.user.findFirst();
    if (!currentUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    
    if (data.radiusKm !== undefined && (data.radiusKm < 5 || data.radiusKm > 100)) {
      return NextResponse.json({ success: false, error: 'Radius must be between 5 and 100 km' }, { status: 400 });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: data.name,
        areaLabel: data.areaLabel,
        radiusKm: data.radiusKm,
        skills: data.skills,
        availableNow: data.availableNow,
        lat: data.lat,
        lng: data.lng
      }
    });
    
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
