
export type Tool = 'dashboard' | 'docs' | 'resume' | 'analyzer' | 'settings' | 'illustrations' | 'storage' | 'exam' | 'notes' | 'solver' | 'blueprint' | 'handwriting' | 'editor' | 'ai-assistant';

// Define which tools are considered premium
export const premiumTools: Tool[] = [
    'editor',
    'solver',
    'blueprint',
    'handwriting',
    'ai-assistant',
];

// Define which tools are freemium (basic features free, some premium)
export const freemiumTools: Tool[] = [
    'docs',
    'exam',
    'notes',
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
        discountedPrice: 29,
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
        discountedPrice: 199,
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
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_eJt4sZ4aN3bO8Q';
