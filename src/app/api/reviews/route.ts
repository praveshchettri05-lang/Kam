import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { workPostId, reviewerId, revieweeId, stars, comment } = await req.json();
    
    if (!workPostId || !reviewerId || !revieweeId || !stars) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    if (reviewerId === revieweeId) {
      return NextResponse.json({ success: false, error: 'Cannot review yourself' }, { status: 400 });
    }
    if (stars < 1 || stars > 5) {
      return NextResponse.json({ success: false, error: 'Stars must be 1-5' }, { status: 400 });
    }
    
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: { workPostId, reviewerId, revieweeId, stars, comment }
      });
      
      const userReviews = await tx.review.findMany({
        where: { revieweeId }
      });
      
      const reviewCount = userReviews.length;
      const rating = userReviews.reduce((acc, curr) => acc + curr.stars, 0) / reviewCount;
      
      await tx.user.update({
        where: { id: revieweeId },
        data: { rating, reviewCount }
      });
      
      return newReview;
    });
    
    return NextResponse.json({ success: true, review });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
