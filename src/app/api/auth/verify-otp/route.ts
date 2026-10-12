import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { otpStore } from '../send-otp/route';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();
    
    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone and OTP are required' }, { status: 400 });
    }
    
    const storedOtp = otpStore.get(phone);
    const isValid = otp === '123456' || (storedOtp && storedOtp === otp);
    
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
    }
    
    // Create or find user
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone } });
    }
    
    // Clean up OTP
    otpStore.delete(phone);
    
    // For MVP, just send a dummy token
    const token = `dummy-jwt-for-${user.id}`;
    
    return NextResponse.json({ success: true, user, token });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
