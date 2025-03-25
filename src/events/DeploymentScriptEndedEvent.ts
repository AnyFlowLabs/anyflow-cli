import { BaseEvent } from './BaseEvent';

export class DeploymentScriptEndedEvent extends BaseEvent {
  is_essential: boolean = true;

  constructor(
    chainDeploymentId: number,
    exitCode: number,
    stdout: string,
    stderr: string,
    executionTime: number,
  ) {
    super('deployment_script_ended_event', {
      chain_deployment_id: chainDeploymentId,
      exitCode,
      stdout,
      stderr,
      executionTime,
    });
  }
}