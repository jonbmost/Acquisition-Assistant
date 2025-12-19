import { GoogleAuth } from "google-auth-library";

export async function fetchFromCloudRun(
  url: string,
  options: RequestInit = {}
) {
  const auth = new GoogleAuth({
    workloadIdentityProvider: process.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER,
    serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT
  });

  const client = await auth.getIdTokenClient(url);
  const headers = await client.getRequestHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}
