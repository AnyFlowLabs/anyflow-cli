import axios from "axios";
import { getToken } from "../commands/auth/store-token/store";

const instance = axios.create({
    baseURL: process.env.ANYFLOW_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

instance.interceptors.request.use(
    async (config) => {
        // Get the token from the system keychain
        const token = await getToken();

        if (token) {
            // Set the Authorization header with the token
            config.headers.Authorization = `Bearer ${token}`;
        }

        // if (process.env.DEBUG) {
        //     console.log(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
        //     // console.log(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, { data: config.data, headers: config.headers });
        // }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

instance.interceptors.response.use(
    (response) => {
        // if (process.env.DEBUG) {
        //     console.log(`HTTP Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        // }

        return response;
    },
    (error) => {
        // if (process.env.DEBUG) {
        //     console.log(`HTTP Response: ${error.response?.config.method?.toUpperCase()} ${error.response?.config.url}`, error?.response.data);
        // }

        if (error.response?.status === 401) {
            console.warn("HTTP 401. Invalid or expired token. Please run 'anyflow auth' to authenticate.");
            process.exit(1);
        }

        if (error.response?.status === 429) {
            console.warn("HTTP 219. Too many requests. Please try again later.");
            process.exit(1);
        }

        if (error.response?.status === 500) {
            console.error("HTTP 500. API error. Try again later or contact support if the issue persists.");
            process.exit(1);
        }

        console.error("API error:", error.message);

        return Promise.reject(error);
    },
);


export default instance;
