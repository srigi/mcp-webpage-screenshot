import { Browser, chromium } from 'playwright';

import { tryCatch } from '~/utils/tryCatch';

export class BrowserLaunchError extends Error {
  name = 'BrowserLaunchError';
}

let browserInstance: Browser | undefined;

export async function getBrowser() {
  if (browserInstance == null) {
    const [launchErr, browser] = await tryCatch(chromium.launch({ headless: true }));
    if (launchErr) {
      throw new BrowserLaunchError(`Failed to launch browser: ${launchErr.message}`, { cause: launchErr });
    }

    browserInstance = browser;
  }

  return browserInstance;
}
