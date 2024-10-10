import axios from "axios";
import * as keytar from "keytar";

const SERVICE_NAME = "AnyFlowCLI";
const ACCOUNT_NAME = "apiToken";

export async function deploy() {
  const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  if (!token) {
    console.log('You need to authenticate first. Run "anyflow auth".');
    return;
  }

  console.log("Deploying with authenticated backend call...");
  try {
    // Replace with actual API URL
    const response = await axios.post(
      "https://your-backend-api-url/deploy",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log("Deployment successful:", response.data);
  } catch (error: any) {
    console.error("Failed to deploy:", error.message);
  }
}
