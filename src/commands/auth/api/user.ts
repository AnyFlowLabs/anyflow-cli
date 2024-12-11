import axios from "../../../utils/axios";

// Make a request to get user information
export async function getUserResponse(token: string) {
  const response = await axios.get(`api/user`);
  return response
}

// Verify the token by getting user information
export async function getUser(token: string) {
  const response = await getUserResponse(token);

  if (response?.status === 200) {
    console.log("User authenticated.");
  }

  return response.data;
}