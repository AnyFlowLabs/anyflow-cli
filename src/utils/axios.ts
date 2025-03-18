import axios from 'axios';

import { getToken } from '../commands/auth/store-token/store';
import { getEnvVar } from './env-manager';

const instance = axios.create({
  baseURL: getEnvVar('ANYFLOW_BACKEND_URL'),
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  async (config) => {
    // Get the token from the system keychain
    const token = await getToken();

    if (token) {
      // Set the Authorization header with the token
      config.headers.Authorization = `Bearer ${token}`;
    }

    const debug = getEnvVar('ANYFLOW_DEBUG') === 'true';
    if (debug) {
      console.log(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
      // console.log(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, { data: config.data, headers: config.headers });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  (response) => {
    const debug = getEnvVar('ANYFLOW_DEBUG') === 'true';
    if (debug) {
      console.log(`HTTP Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error) => {
    const debug = getEnvVar('ANYFLOW_DEBUG') === 'true';
    if (debug) {
      console.log(`HTTP Response: ${error.response?.config.method?.toUpperCase()} ${error.response?.config.url}`, error?.response?.data);
    }

    if (error.response?.config?.url === 'api/events') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      console.warn('HTTP 401. Invalid or expired token. Please run \'anyflow auth\' to authenticate.');
      process.exit(1);
    }

    if (error.response?.status === 429) {
      console.warn('HTTP 219. Too many requests. Please try again later.');
      process.exit(1);
    }

    if (error.response?.status === 500) {
      console.error('HTTP 500. API error. Try again later or contact support if the issue persists.');
      process.exit(1);
    }

    console.error('API error:', error.message);

    return Promise.reject(error);
  },
);


export default instance;
