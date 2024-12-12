import packageJson from "../../package.json";
import axios from '../utils/axios';
import { randomUUID } from 'crypto';

export class BaseEvent {
    event_id: string;
    event_type: string;
    payload: any;
    timestamp?: string;
    session_id?: string;
    cli_version?: string;

    static EVENT_TYPE_PREFIX = 'CLI_';

    constructor(
        event_type: string,
        payload: any,
        timestamp?: string,
    ) {
        this.event_id = randomUUID();
        this.event_type = event_type;
        this.payload = payload;

        this.timestamp = timestamp ?? new Date().toISOString().slice(0, -1);
        this.cli_version = packageJson.version;
    }

    toJSON() {
        return {
            event_id: this.event_id,
            session_id: this.session_id,
            event_type: BaseEvent.EVENT_TYPE_PREFIX + this.event_type,
            payload: this.payload,
            timestamp: this.timestamp,
            cli_version: this.cli_version,
        };
    }

    async send() {
        return await axios.post("api/events", this.toJSON());
    }
}