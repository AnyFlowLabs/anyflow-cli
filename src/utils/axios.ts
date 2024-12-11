import axios from "axios";
import { BACKEND_URL } from "../config/internal-config";

export default axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
