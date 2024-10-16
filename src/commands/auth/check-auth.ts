import { getUser } from "./api/user.js";
import { getToken } from "./store-token/store.js";

// Check if the user is authenticated
export async function checkAuth() {
  const token = await getToken();
  
  if (!token) {
    console.log("Missing token. Please run 'anyflow auth' to authenticate.");
    process.exit(1);
  }

  await getUser(token);
}