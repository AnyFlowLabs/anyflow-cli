import { BaseEvent } from './BaseEvent';

export class DeploymentScriptStartedEvent extends BaseEvent {
  is_essential: boolean = true;

  constructor(chainDeploymentId: number, command: string) {
    super('deployment_script_started_event', {
      command,
      chain_deployment_id: chainDeploymentId,
    });
  }
}