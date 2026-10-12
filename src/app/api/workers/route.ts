import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ success: true, workers: [] });
  }
  try {
    const { searchParams } = new URL(req.url);
    const userLat = parseFloat(searchParams.get('lat') || '12.9716');
    const userLng = parseFloat(searchParams.get('lng') || '77.5946');
    const radiusKm = parseFloat(searchParams.get('radiusKm') || '100');
    const skill = searchParams.get('skill');

    const workers = await prisma.user.findMany({
      where: {
        isWorker: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        photoUrl: true,
        skills: true,
        rating: true,
        reviewCount: true,
        availableNow: true,
        experienceYears: true,
        expectedPay: true,
        payType: true,
        areaLabel: true,
        about: true,
        lat: true,
        lng: true,
      },
    });

    const workersWithDistance = workers.map((w) => {
      const distance =
        w.lat && w.lng
          ? getDistanceFromLatLonInKm(userLat, userLng, w.lat, w.lng)
          : 3.5;
      return {
        ...w,
        distance,
      };
    });

    const filtered = workersWithDistance
      .filter((w) => {
        if (skill && skill !== 'all' && !w.skills.includes(skill)) return false;
        return w.distance <= radiusKm;
      })
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.distance - b.distance);

    return NextResponse.json({
      success: true,
      workers: filtered.length > 0 ? filtered : workersWithDistance,
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
