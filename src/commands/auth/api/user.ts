import axios from "../../../utils/axios";

// Make a request to get user information
export async function getUserResponse(token?: string) {
  const response = await axios.get(`api/user`,
    {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    }
  );
  return response
}

// Verify the token by getting user information
export async function getUser(token?: string) {
  const response = await getUserResponse(token);
  return response.data;
}