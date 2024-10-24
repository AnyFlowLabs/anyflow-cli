import axios from "axios";

const BACKEND_URL = "https://api-staging.anyflow.pro/api";

// Make a request to get user information
export async function getUserResponse(token:string) {
    const response = await axios.get(`${BACKEND_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  
    return response
}
  
// Verify the token by getting user information
export async function getUser(token:string) {
  try {
    const response = await getUserResponse(token);

    return response.data;
  } catch (error: any) {
    if (error.response.status === 200) {
      console.log("User authenticated.");
    } else if (error.response.status === 401) {
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