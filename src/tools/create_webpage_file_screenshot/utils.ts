import { Browser, chromium } from 'playwright';
import type { Logger } from 'winston';

import { tryCatch } from '~/utils/tryCatch.js';

export class BrowserLaunchError extends Error {
  name = 'BrowserLaunchError';
}

export class CreateWebpageFileScreenshotError extends Error {
  name = 'CreateWebpageFileScreenshotError';
}

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

export function getUtils(logger: Logger) {
  return {
    async createWebpageFileScreenshot(
      webpageFilePath: string,
      viewport = { width: 780, height: 1080 },
      fullPage = true,
      colorScheme?: 'light' | 'dark' | 'no-preference',
    ): Promise<Buffer> {
      logger.debug('[create_webpage_file_screenshot] util/createWebpageFileScreenshot called', { webpageFilePath });

      const browser = await getBrowser();
      const [contextErr, context] = await tryCatch(browser.newContext({ colorScheme, viewport }));
      if (contextErr) {
        throw new CreateWebpageFileScreenshotError(`Failed to create browser context: ${contextErr.message}`, { cause: contextErr });
      }

      const [pageErr, page] = await tryCatch(context.newPage());
      if (pageErr) {
        await context.close();
        throw new CreateWebpageFileScreenshotError(`Failed to create browser page: ${pageErr.message}`, { cause: contextErr });
      }

      const [screenshotErr, buffer] = await tryCatch(
        page.goto(`file://${webpageFilePath}`, { waitUntil: 'networkidle' }).then(() => page.screenshot({ fullPage })),
      );
      if (screenshotErr) {
        await context.close();
        throw new CreateWebpageFileScreenshotError(`Failed to take screenshot: ${screenshotErr.message}`, { cause: screenshotErr });
      }

      return buffer;
    },
  };
}
