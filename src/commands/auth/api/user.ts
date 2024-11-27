import axios from "axios";
import { BACKEND_URL } from "../../../config/internal-config";

// Make a request to get user information
export async function getUserResponse(token:string) {
    const response = await axios.get(`${BACKEND_URL}k/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(response.data);
    console.log(response);
    console.log("evydaguiwohdaoijdiwojad");
    return response
}
  
// Verify the token by getting user information
export async function getUser(token:string) {
  const response = await getUserResponse(token);
  try {
    if (response?.status === 200) {
      console.log("User authenticated.");
    }

    return response.data;
  } catch (error: any) {
    console.log(error);
    if (error.response.status === 401) {
      console.log("Invalid or expired token. Please run 'anyflow auth' to authenticate. STATUS: " + error.response.status);
      process.exit(1);
    } else if (error.response.status === 429) {
      console.log("Too many requests. Please try again later. STATUS: " + error.response.status);
      process.exit(1);
    } else {
      console.log("API error. Try again later or contact support if the issue persists. STATUS: " + error.response.status);
      process.exit(1);
    }
  }
}