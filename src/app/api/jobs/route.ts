import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Haversine formula to compute distance in km
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
    return NextResponse.json({ success: true, jobs: [] });
  }
  try {
    const { searchParams } = new URL(req.url);
    const userLat = parseFloat(searchParams.get('lat') || '12.9716'); // Default to Bengaluru
    const userLng = parseFloat(searchParams.get('lng') || '77.5946');
    const radiusKm = parseFloat(searchParams.get('radiusKm') || '100');
    const category = searchParams.get('category');
    const urgent = searchParams.get('urgent') === 'true';

    const whereClause: any = {};
    if (category && category !== 'all') whereClause.category = category;
    if (urgent) whereClause.isUrgent = true;

    const jobs = await prisma.workPost.findMany({
      where: whereClause,
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            photoUrl: true,
            areaLabel: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const jobsWithDistance = jobs.map((job) => {
      const distance = getDistanceFromLatLonInKm(userLat, userLng, job.lat, job.lng);
      return {
        ...job,
        distance,
      };
    });

    // Filter within radius and sort nearest first
    const withinRadius = jobsWithDistance
      .filter((j) => j.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      success: true,
      jobs: withinRadius.length > 0 ? withinRadius : jobsWithDistance, // fallback to all if radius is narrow
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.title || data.title.length > 120) {
      return NextResponse.json({ success: false, error: 'Invalid title' }, { status: 400 });
    }
    const payNum = parseInt(String(data.payAmount), 10);
    if (isNaN(payNum) || payNum <= 0) {
      return NextResponse.json({ success: false, error: 'Pay amount must be > 0' }, { status: 400 });
    }

    // Resolve or create poster user
    let poster: any = null;
    if (data.posterId) {
      poster = await prisma.user.findUnique({ where: { id: data.posterId } });
    }
    if (!poster && data.posterPhone) {
      poster = await prisma.user.upsert({
        where: { phone: data.posterPhone },
        create: {
          phone: data.posterPhone,
          name: data.authorName || 'Kam Member',
          areaLabel: data.areaLabel || 'Local Area',
        },
        update: {
          name: data.authorName || undefined,
        },
      });
    }
    if (!poster) {
      poster = await prisma.user.findFirst();
    }
    if (!poster) {
      poster = await prisma.user.create({
        data: {
          phone: '+919876543210',
          name: data.authorName || 'Kam Member',
          areaLabel: data.areaLabel || 'Local Area',
        },
      });
    }

    const payTypeMap: Record<string, 'HOURLY' | 'DAILY' | 'FIXED' | 'PER_UNIT'> = {
      hour: 'HOURLY',
      day: 'DAILY',
      job: 'FIXED',
      fixed: 'FIXED',
      unit: 'PER_UNIT',
      HOURLY: 'HOURLY',
      DAILY: 'DAILY',
      FIXED: 'FIXED',
      PER_UNIT: 'PER_UNIT',
    };

    const newJob = await prisma.workPost.create({
      data: {
        posterId: poster.id,
        category: data.category || 'other',
        title: data.title,
        description: data.description || '',
        payAmount: payNum,
        payType: payTypeMap[data.payType] || 'DAILY',
        lat: typeof data.lat === 'number' ? data.lat : 12.9716,
        lng: typeof data.lng === 'number' ? data.lng : 77.5946,
        areaLabel: data.areaLabel || poster.areaLabel || 'Nearby',
        isUrgent: Boolean(data.isUrgent),
        peopleNeeded: data.peopleNeeded || 1,
      },
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
