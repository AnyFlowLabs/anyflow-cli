import { BaseEvent } from './BaseEvent';

export class ProgramEndedEvent extends BaseEvent {
  is_essential: boolean = true;

  constructor(exitCode: number, executionTime: number) {
    super('program_ended', {
      exit_code: exitCode,
      execution_time: executionTime,
    });
  }
}