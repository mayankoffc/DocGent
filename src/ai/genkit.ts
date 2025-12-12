import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set. Please add it to your .env file.");
}

// Use the explicit project ID from .env if available, otherwise fallback to service account
const gcpProjectId = process.env.GCP_PROJECT_ID;

if (!gcpProjectId) {
    throw new Error("GCP_PROJECT_ID is not set in your .env file. Please add the ID of the project with billing enabled.");
}

export const ai = genkit({
  plugins: [
    googleAI({
      // Switch from the free-tier Gemini API to the enterprise-grade Vertex AI API.
      // This will use your Google Cloud project's billing and provide much higher rate limits.
      apiClient: 'vertex',
      location: 'us-central1',
      // Explicitly tell Genkit which project to use for billing.
      project: gcpProjectId,
    }),
  ],
  // By setting a default model here, all flows that don't specify a model
  // will use this reliable and fast text generation model.
  model: 'googleai/gemini-2.0-flash',
});
