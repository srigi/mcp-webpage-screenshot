import { Browser, chromium } from 'playwright';

import { tryCatch } from '~/utils/tryCatch.js';
import { getLogger } from '~/logger';

export class BrowserLaunchError extends Error {
  name = 'BrowserLaunchError';
}

export class CreateWebpageFileScreenshotError extends Error {
  name = 'CreateWebpageFileScreenshotError';
}

type Options = {
  colorScheme?: 'light' | 'dark' | 'no-preference';
  viewport?: {
    width: number;
    height: number | 'fullpage';
  };
};

export const DEFAULT_VIEWPORT_WIDTH = 1280;
export const DEFAULT_VIEWPORT_HEIGHT = 768;
let browserInstance: Browser | undefined;

async function getBrowser() {
  if (browserInstance == null) {
    const [launchErr, browser] = await tryCatch(chromium.launch({ headless: true }));
    if (launchErr) {
      throw new BrowserLaunchError(`Failed to launch browser: ${launchErr.message}`, { cause: launchErr });
    }

    browserInstance = browser;
  }

  return browserInstance;
}

export async function createWebpageFileScreenshot(webpageFilePath: string, options: Options): Promise<[Buffer, string]> {
  getLogger().debug('[🛠️ create_webpage_file_screenshot] util/createWebpageFileScreenshot called', { webpageFilePath, options });

  const browser = await getBrowser();
  const [pageErr, page] = await tryCatch(
    browser.newPage({
      colorScheme: options.colorScheme,
      viewport: {
        width: options.viewport?.width || DEFAULT_VIEWPORT_WIDTH,
        height: typeof options.viewport?.height === 'number' ? options.viewport.height : DEFAULT_VIEWPORT_HEIGHT,
      },
    }),
  );
  if (pageErr) {
    throw new CreateWebpageFileScreenshotError(`Failed to create browser page: ${pageErr.message}`, { cause: pageErr });
  }

  const [screenshotErr, buffer] = await tryCatch(
    page
      .goto(`file://${webpageFilePath}`, { waitUntil: 'networkidle' })
      .then(() => page.screenshot({ fullPage: options.viewport?.height === 'fullpage', type: 'png' })),
  );
  if (screenshotErr) {
    throw new CreateWebpageFileScreenshotError(`Failed to take screenshot: ${screenshotErr.message}`, { cause: screenshotErr });
  }

  return [buffer, 'image/png'];
}
