import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleAuth } from "google-auth-library";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const auth = new GoogleAuth({
    workloadIdentityProvider: process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER,
    serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT
  });

  const client = await auth.getIdTokenClient(
    "https://rapidacq-api-266001336704.us-central1.run.app"
  );

  const headers = await client.getRequestHeaders();

  const response = await fetch(
    "https://rapidacq-api-266001336704.us-central1.run.app/health",
    { headers }
  );

  const data = await response.json();
  res.status(200).json(data);
}
