import axios from "axios";
import { BACKEND_URL, SUPPORTED_CHAINS } from "../../config/internal-config";

export async function getChains() {
    try {
        const chains = await axios.get(`${BACKEND_URL}/chains`);
        return chains.data;
    } catch (error) {
        console.warn('Failed to fetch chains from API, using default supported chains');
        return SUPPORTED_CHAINS;
    }
}