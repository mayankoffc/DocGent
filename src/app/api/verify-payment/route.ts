
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keySecret) {
    console.error('Razorpay Key Secret is not defined in environment variables.');
    throw new Error('Razorpay Key Secret is not defined in environment variables.');
}

export async function POST(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing payment details.' }, { status: 400 });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body.toString())
            .digest("hex");

        const isVerified = expectedSignature === razorpay_signature;

        return NextResponse.json({ isVerified }, { status: 200 });

    } catch (error) {
        console.error("Error verifying Razorpay payment:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
