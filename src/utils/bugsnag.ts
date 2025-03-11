import Bugsnag from '@bugsnag/js';
import packageJson from '../../package.json';

export function initBugsnag() {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    const apiKey = process.env.BUGSNAG_API_KEY || '';
    
    if (!apiKey) {
      console.warn('Bugsnag API key not found. Error tracking is disabled.');
      return;
    }
    
    Bugsnag.start({
      apiKey,
      appVersion: packageJson.version,
      releaseStage: process.env.NODE_ENV,
      enabledReleaseStages: ['production', 'staging'],
      autoDetectErrors: true,
      metadata: {
        cli: {
          nodeVersion: process.version,
          platform: process.platform,
        }
      }
    });

    console.debug('Bugsnag initialized for error tracking');
  }
}

export function notifyBugsnag(error: Error, metadata?: Record<string, any>) {
  if (Bugsnag.isStarted()) {
    Bugsnag.notify(error, (event) => {
      if (metadata) {
        event.addMetadata('customData', metadata);
      }
    });
  }
} 