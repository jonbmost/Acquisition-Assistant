import { fetchFromCloudRun } from "@/lib/cloudRunFetch";

export default async function handler(req, res) {
  const response = await fetchFromCloudRun(
    "https://rapidacq-api-266001336704.us-central1.run.app/health"
  );

  const data = await response.json();
  res.status(200).json(data);
}
