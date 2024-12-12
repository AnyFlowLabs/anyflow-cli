import { BaseEvent } from "./BaseEvent";

export class ProgramStartedEvent extends BaseEvent {
    constructor(
        args: string,
    ) {
        super('program_started', {
            arguments
        });
    }
}