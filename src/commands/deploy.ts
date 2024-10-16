import axios from "axios";
import { getToken } from "./auth/store-token/store.js";

export async function deploy() {
  let token = await getToken();

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
