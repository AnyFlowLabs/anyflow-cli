import { BaseEvent } from './BaseEvent';

export class ProgramStartedEvent extends BaseEvent {
  is_essential: boolean = true;

  constructor(
    args: string,
  ) {
    super('program_started', {
      arguments
    });
  }
}