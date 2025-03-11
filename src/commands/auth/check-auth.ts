import { getUser } from './api/user';
import logger from '../../utils/logger';

// Check if the user is authenticated
export async function checkAuth() {
  const user = await getUser();

  logger.success(`You are authenticated as: ${user.name}<${user.email}>`);
}
