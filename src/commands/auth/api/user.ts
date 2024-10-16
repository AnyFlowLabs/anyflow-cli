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
    const response = await getUserResponse(token);
  
    if (response.status === 200) {
      console.log("User authenticated.");
    } else if (response.status === 401) {
      console.log("Invalid or expired token. Please run 'anyflow auth' to authenticate.");
      process.exit(1);
    } else if (response.status === 429) {
      console.log("Too many requests. Please try again later.");
      process.exit(1);
    } else {
      console.log("API error. Try again later or contact support if the issue persists.");
      process.exit(1);
    }
    
    return response.data;
}