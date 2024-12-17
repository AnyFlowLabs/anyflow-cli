import { randomUUID } from 'crypto';

import { Mutex } from 'async-mutex';

import { isAuthenticated } from '../commands/auth/store-token/store';
import { BaseEvent } from './BaseEvent';

export class EventDispatcher {
  private static _instance: EventDispatcher;
  private pendingEvents: BaseEvent[] = [];
  private mutex = new Mutex();
  private sessionId: string;

  private constructor() {
    this.sessionId = randomUUID();
  }

  public static getInstance(): EventDispatcher {
    if (!this._instance) {
      this._instance = new EventDispatcher();
    }
    return this._instance;
  }

  /**
     * Dispatches an event without waiting for it to be sent.
     * Also does not break if the event fails to send.
     *
     * @param event 
     */
  public async dispatchEvent(event: BaseEvent): Promise<void> {
    // if (process.env.DEBUG) {
    //     console.log("Dispatching event...", event);
    // }

    if (!await isAuthenticated()) {
      return;
    }

    event.session_id = this.sessionId;

    this.pendingEvents.push(event);

    await event.send()
      .then(() => {
        // if (process.env.DEBUG) {
        //     console.log("Event sent", event);
        // }
      })
      .catch((error) => {
        if (process.env.DEBUG) {
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
      console.log('Waiting for all events end...');
    }

    while (this.pendingEvents.length > 0) {
      if (Date.now() - start > timeout) {
        throw new Error('Timed out waiting for all events to send.');
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}