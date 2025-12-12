
export type Tool = 'dashboard' | 'docs' | 'resume' | 'analyzer' | 'settings' | 'upscaler' | 'storage' | 'exam' | 'notes' | 'solver' | 'blueprint' | 'editor' | 'ai-assistant' | 'watermark-adder' | 'watermark-adder-compression' | 'upscaler-4k' | 'upscaler-6k' | 'upscaler-8k';

// Define which tools are considered premium
export const premiumTools: Tool[] = [
    'editor',
    'solver',
    'blueprint',
    'ai-assistant',
    'watermark-adder-compression',
    'upscaler-4k',
    'upscaler-6k',
    'upscaler-8k',
];

// Define which tools are freemium (basic features free, some premium)
export const freemiumTools: Tool[] = [
    'docs',
    'exam',
    'notes',
    'watermark-adder',
    'upscaler',
];


export function isPremiumTool(tool: Tool): boolean {
    return premiumTools.includes(tool);
}

// Define plan details
export const प्लांस = {
    monthly: {
        id: 'plan_monthly',
        name: 'Monthly',
        price: 200,
        discountedPrice: 29, // Default price
        features: [
            'Access all premium tools',
            'Generate unlimited documents',
            'Access all powerful AI-powered GPT features',
            'Priority email support',
        ]
    },
    yearly: {
        id: 'plan_yearly',
        name: 'Yearly',
        price: 2400,
        discountedPrice: 199, // Default price
        features: [
            'Access all premium tools',
            'Generate unlimited documents',
            'Access all powerful AI-powered GPT features',
            'Priority email support',
            'Save over 40% (2 months free)',
        ]
    }
};

// This would be your Razorpay Key ID
// It's safe to expose the Key ID on the client-side. The Key Secret must be kept on a server.
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
