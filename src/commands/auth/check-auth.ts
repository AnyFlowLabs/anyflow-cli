import { getUser } from './api/user';

// Check if the user is authenticated
export async function checkAuth() {
  const user = await getUser();

  console.log(`You are authenticated as: ${user.name}<${user.email}>`);
}
