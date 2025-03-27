import { randomUUID } from 'crypto';

import { Mutex } from 'async-mutex';

import { isAuthenticated } from '../commands/auth/store-token/store';
import { BaseEvent } from './BaseEvent';
import { getEnvVar } from '../utils/env-manager';
import { globalOptions } from '../utils/globalOptions';
import { options } from 'axios';
import logger from '../utils/logger';

export class EventDispatcher {
  private static _instance: EventDispatcher;
  private pendingEvents: BaseEvent[] = [];
  private mutex = new Mutex();
  private sessionId: string;
  private skipEvents: boolean = false;

  private constructor() {
    this.sessionId = randomUUID();
    this.skipEvents = globalOptions.getOption('skipEvents');
  }

  public static getInstance(): EventDispatcher {
    if (!this._instance) {
      this._instance = new EventDispatcher();
    }
    return this._instance;
  }

  public setSkipEvents(skip: boolean): void {
    this.skipEvents = skip;
  }

  /**
     * Dispatches an event without waiting for it to be sent.
     * Also does not break if the event fails to send.
     *
     * @param event 
     */
  public async dispatchEvent(event: BaseEvent): Promise<void> {
    if (this.skipEvents && !event.is_essential) {
      return;
    }

    if (globalOptions.getOption('debug')) {
      logger.debug("Dispatching event...", event);
    }

    if (!await isAuthenticated()) {
      return;
    }

    event.session_id = this.sessionId;

    this.pendingEvents.push(event);

    await event.send()
      .then(() => {
        if (globalOptions.getOption('debug')) {
          logger.debug("Event sent", event);
        }
      })
      .catch((error) => {
        if (globalOptions.getOption('debug')) {
          console.error('Failed to send event', event, {
            status: error.status,
            message: error.message,
            data: error?.response?.data || {},
          });
        }
      })
      .finally(async () => {
        const release = await this.mutex.acquire();
        try {
          this.pendingEvents = this.pendingEvents.filter((e) => e.event_id !== event.event_id);
        } finally {
          release();
        }
      });
  }

  public async waitForAllEvents(): Promise<void> {
    const timeout = 1000 * 60 * 1; // 1 minute
    const start = Date.now();

    if (this.pendingEvents.length > 0) {
      logger.info('Waiting for all events end...');
    }

    while (this.pendingEvents.length > 0) {
      if (Date.now() - start > timeout) {
        if (globalOptions.getOption('debug')) {
          throw new Error('Timed out waiting for all events to send.');
        } else {
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

export const eventDispatcher = EventDispatcher.getInstance();