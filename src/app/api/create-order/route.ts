
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomBytes } from 'crypto';
import { getAppSettings } from '@/ai/flows/get-app-settings';

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
    console.error('Razorpay Key ID or Key Secret is not defined in environment variables.');
    throw new Error('Razorpay Key ID or Key Secret is not defined in environment variables.');
}

const instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
});

export async function POST(req: Request) {
    try {
        const { plan } = await req.json();

        if (!plan || (plan !== 'monthly' && plan !== 'yearly')) {
            return NextResponse.json({ error: 'Invalid plan provided.' }, { status: 400 });
        }

        // Fetch the latest prices from the server-side settings
        const appSettings = await getAppSettings();
        if (!appSettings) {
             return NextResponse.json({ error: 'Could not retrieve pricing information.' }, { status: 500 });
        }

        const amount = plan === 'monthly' ? appSettings.monthlyPrice : appSettings.yearlyPrice;
        
        // Amount must be in the smallest currency unit (paise for INR)
        const amountInPaise = amount * 100;

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_order_${randomBytes(4).toString('hex')}`,
        };

        const order = await instance.orders.create(options);

        if (!order) {
            return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
        }
        
        return NextResponse.json(order, { status: 200 });

    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
