import axios from 'axios';

import { getToken } from '../commands/auth/store-token/store';
import { getEnvVar } from './env-manager';
import { globalOptions } from './globalOptions';
import { EXIT_CODE_GENERIC_ERROR } from './exitCodes';
import logger from './logger';

const instance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  async (config) => {
    // Get the token from the system keychain
    const token = await getToken();
    config.baseURL = globalOptions.getOption('backendUrl') || getEnvVar('ANYFLOW_BACKEND_URL');

    if (token) {
      // Set the Authorization header with the token
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (globalOptions.getOption('debug')) {
      logger.debug(`HTTP Request: ${config.method?.toUpperCase()} ${config.baseURL}/${config.url}`, config.data);
      // logger.debug(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, { data: config.data, headers: config.headers });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  (response) => {
    if (globalOptions.getOption('debug')) {
      logger.debug(`HTTP Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  },
  (error) => {
    if (globalOptions.getOption('debug')) {
      logger.debug(`HTTP Response: ${error.response?.config.method?.toUpperCase()} ${error.response?.config.url}`, error?.response?.data);
    }

    if (error.response?.config?.url === 'api/events') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      console.warn('HTTP 401. Invalid or expired token. Please run \'anyflow auth\' to authenticate.');
      process.exit(EXIT_CODE_GENERIC_ERROR);
    }

    if (error.response?.status === 429) {
      console.warn('HTTP 219. Too many requests. Please try again later.');
      process.exit(EXIT_CODE_GENERIC_ERROR);
    }

    if (error.response?.status === 500) {
      console.error('HTTP 500. API error. Try again later or contact support if the issue persists.');
      process.exit(EXIT_CODE_GENERIC_ERROR);
    }

    console.error('API error:', error.message);

    return Promise.reject(error);
  },
);


export default instance;
