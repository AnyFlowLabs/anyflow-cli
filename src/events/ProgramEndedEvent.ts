import { BaseEvent } from './BaseEvent';

export class ProgramEndedEvent extends BaseEvent {
  constructor(exitCode: number, executionTime: number) {
    super('program_ended', {
      exit_code: exitCode,
      execution_time: executionTime,
    });
  }
}