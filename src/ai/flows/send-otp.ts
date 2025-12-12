
'use server';
/**
 * @fileOverview A server-side flow to send a One-Time Password (OTP) to a user's email.
 *
 * - sendOtp - The main function to handle sending the email.
 * - SendOtpInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// We are not using a model here, but we define a flow for consistency and potential future logging/tool use.
const SendOtpInputSchema = z.object({
  email: z.string().email().describe("The recipient's email address."),
  otp: z.string().length(6).describe("The 6-digit One-Time Password."),
  userName: z.string().optional().describe("The user's name, for personalizing the email."),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

export async function sendOtp(input: SendOtpInput): Promise<{ success: boolean; message: string }> {
  return sendOtpFlow(input);
}

const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async ({ email, otp, userName }) => {
    const sendGridApiKey = process.env.SENDGRID_API_KEY;

    if (!sendGridApiKey) {
      console.error("SendGrid API key is not configured.");
      throw new Error("Email service is not configured. Could not send OTP.");
    }

    const emailBody = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #34304D; text-align: center;">Your One-Time Password</h2>
          <p>Hello ${userName || 'User'},</p>
          <p>Thank you for using DOC AI. Please use the following code to complete your action. This code is valid for 10 minutes.</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 8px; padding: 12px 20px; background-color: #f2f2f2; border-radius: 5px;">
              ${otp}
            </span>
          </div>
          <p>If you did not request this code, please ignore this email.</p>
          <p>Best regards,<br>The DOC AI Team</p>
        </div>
      </div>
    `;

    const sendgridPayload = {
      personalizations: [{ to: [{ email }] }],
      from: { email: 'docgentor@gmail.com', name: 'DOC AI Verification' },
      subject: `Your DOC AI Verification Code: ${otp}`,
      content: [{ type: 'text/html', value: emailBody }],
    };

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendgridPayload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`SendGrid API error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error('Failed to send the email via SendGrid.');
      }

      return { success: true, message: 'OTP sent successfully.' };
    } catch (error: any) {
      console.error('Error in sendOtpFlow:', error);
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }
);
