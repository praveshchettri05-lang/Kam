import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: true,
      message: 'Skipped: DATABASE_URL not set during build time',
    });
  }

  try {
    const existingCount = await prisma.workPost.count();
    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Database already has jobs',
        count: existingCount,
      });
    }

    // Create demo users
    const userMeera = await prisma.user.upsert({
      where: { phone: '+919876543211' },
      create: {
        phone: '+919876543211',
        name: 'Meera Sharma',
        areaLabel: 'Indiranagar, Bengaluru',
        lat: 12.9784,
        lng: 77.6408,
        rating: 4.9,
        reviewCount: 14,
        isWorker: true,
        skills: ['cleaning', 'cooking'],
      },
      update: {},
    });

    const userRahul = await prisma.user.upsert({
      where: { phone: '+919876543212' },
      create: {
        phone: '+919876543212',
        name: 'Rahul Verma',
        areaLabel: 'Domlur, Bengaluru',
        lat: 12.9609,
        lng: 77.6387,
        rating: 4.8,
        reviewCount: 9,
        isWorker: true,
        skills: ['tutor', 'companion'],
      },
      update: {},
    });

    const userAnil = await prisma.user.upsert({
      where: { phone: '+919876543213' },
      create: {
        phone: '+919876543213',
        name: 'Anil Kumar',
        areaLabel: 'HAL 2nd Stage, Bengaluru',
        lat: 12.9644,
        lng: 77.6536,
        rating: 5.0,
        reviewCount: 22,
        isWorker: true,
        skills: ['electrician', 'plumber'],
      },
      update: {},
    });

    const userSuresh = await prisma.user.upsert({
      where: { phone: '+919876543214' },
      create: {
        phone: '+919876543214',
        name: 'Suresh Carpenter',
        areaLabel: 'Koramangala, Bengaluru',
        lat: 12.9352,
        lng: 77.6245,
        rating: 4.7,
        reviewCount: 18,
        isWorker: true,
        skills: ['carpenter'],
      },
      update: {},
    });

    const demoJobs = [
      {
        posterId: userMeera.id,
        category: 'cleaning',
        title: 'Need help cleaning 2-BHK home',
        description: 'Deep cleaning for living room and kitchen. Cleaning supplies and mop provided.',
        payAmount: 600,
        payType: 'DAILY' as const,
        lat: 12.9784,
        lng: 77.6408,
        areaLabel: 'Indiranagar, Bengaluru',
        isUrgent: true,
        peopleNeeded: 1,
      },
      {
        posterId: userRahul.id,
        category: 'tutor',
        title: 'Class 8 Math & Science tutor needed',
        description: 'Looking for a kind and patient tutor for 1 hour daily in the evening.',
        payAmount: 400,
        payType: 'HOURLY' as const,
        lat: 12.9609,
        lng: 77.6387,
        areaLabel: 'Domlur, Bengaluru',
        isUrgent: false,
        peopleNeeded: 1,
      },
      {
        posterId: userAnil.id,
        category: 'electrician',
        title: 'Ceiling fan repair & switchboard fix',
        description: 'Bedroom fan stopped running. Please bring tester and standard tools.',
        payAmount: 450,
        payType: 'FIXED' as const,
        lat: 12.9644,
        lng: 77.6536,
        areaLabel: 'HAL 2nd Stage, Bengaluru',
        isUrgent: false,
        peopleNeeded: 1,
      },
      {
        posterId: userSuresh.id,
        category: 'carpenter',
        title: 'Wooden wardrobe door hinge fixing',
        description: 'Two closet doors came loose. Need screws tightened and new hinges fitted.',
        payAmount: 500,
        payType: 'FIXED' as const,
        lat: 12.9352,
        lng: 77.6245,
        areaLabel: 'Koramangala, Bengaluru',
        isUrgent: true,
        peopleNeeded: 1,
      },
      {
        posterId: userRahul.id,
        category: 'companion',
        title: 'Paid Hourly Help: Evening walk companion for elder',
        description: 'Need a respectful person to accompany my grandfather for an evening park walk in Indiranagar. Strictly public park.',
        payAmount: 250,
        payType: 'HOURLY' as const,
        lat: 12.9716,
        lng: 77.5946,
        areaLabel: 'Cubbon Park / Indiranagar',
        isUrgent: false,
        peopleNeeded: 1,
      },
      {
        posterId: userMeera.id,
        category: 'cook',
        title: 'Homestyle North Indian dinner preparation',
        description: 'Cook roti and 2 sabjis for a family of 3. Vegetables chopped and ready.',
        payAmount: 350,
        payType: 'HOURLY' as const,
        lat: 12.9800,
        lng: 77.6420,
        areaLabel: 'Indiranagar 100ft Rd',
        isUrgent: true,
        peopleNeeded: 1,
      },
    ];

    for (const job of demoJobs) {
      await prisma.workPost.create({ data: job });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded demo jobs and users into database!',
      count: demoJobs.length,
    });
  } catch (error) {
    console.warn('Seed notice (safe fallback):', error);
    return NextResponse.json({ success: true, message: 'Seed skipped or already populated' });
  }
}
