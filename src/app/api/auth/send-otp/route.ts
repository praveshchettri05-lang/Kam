import { NextRequest, NextResponse } from 'next/server';

// In-memory store for MVP
const otpStore = new Map<string, string>();

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    
    if (!phone || !/^\+91\d{10}$/.test(phone)) {
      return NextResponse.json({ success: false, error: 'Invalid Indian phone number. Use format +91XXXXXXXXXX' }, { status: 400 });
    }
    
    // Generate 6 digit OTP (random)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, otp);
    
    console.log(`OTP for ${phone} is ${otp}`);
    
    return NextResponse.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export { otpStore };
