import { getBrowser } from '~/utils/browser';
import { delay } from '~/utils/delay';
import { getLogger } from '~/utils/logger';
import { tryCatch } from '~/utils/tryCatch';

export class CreateWebpageUrlScreenshotError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'CreateWebpageUrlScreenshotError';
    this.cause = cause;
  }
}

type Options = {
  colorScheme?: 'light' | 'dark' | 'no-preference';
  viewport?: {
    width: number;
    height: number | 'fullpage';
  };
};

export async function createWebpageUrlScreenshot(url: string, options: Options): Promise<[Buffer, string]> {
  const browser = await getBrowser();
  const logger = getLogger();

  const urlObj = new URL(url);
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    throw new CreateWebpageUrlScreenshotError(`Input URL protocol is not supported! ${urlObj.protocol}. Only HTTP and HTTPS are supported.`);
  }

  const [pageErr, page] = await tryCatch(
    browser.newPage({
      colorScheme: options.colorScheme,
      viewport: {
        width: options.viewport?.width ?? 1280,
        height: typeof options.viewport?.height === 'number' ? options.viewport.height : 768,
      },
      // security settings
      acceptDownloads: false,
      bypassCSP: false,
      extraHTTPHeaders: { 'User-Agent': 'Mozilla/5.0 (compatible; MCP-WebpageScreenshot/1.0)' },
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
    }),
  );
  if (pageErr) {
    throw new CreateWebpageUrlScreenshotError(`Failed to create a new page: ${pageErr.message}`, pageErr);
  }

  const retryDelays = [5000, 9000, 15000];
  let lastError: Error | undefined;
  let index = 0;
  try {
    do {
      logger.debug(`[🛠️ create_webpage_url_screenshot] Attempt ${index + 1} to navigate to ${url}`);

      const task = (async () => {
        // navigate
        const [gotoErr] = await tryCatch(() => page.goto(url, { waitUntil: 'networkidle', timeout: retryDelays[index] }));
        if (gotoErr) throw gotoErr;

        // screenshot
        const [screenshotErr, screenshot] = await tryCatch(page.screenshot({ fullPage: options.viewport?.height === 'fullpage', type: 'png' }));
        if (screenshotErr) throw screenshotErr;

        return screenshot;
      })();
      const deadline = delay(retryDelays[index]).then(() => {
        throw new Error(`Timeout exceeded after ${retryDelays[index]}ms`);
      });
      const [taskErr, screenshotBuffer] = await tryCatch<Error, Buffer>(Promise.race([task, deadline]));
      if (!taskErr) {
        logger.debug(`[🛠️ create_webpage_url_screenshot] Successfully captured screenshot of ${url}`);
        const screenshotId = `url_${Buffer.from(url).toString('base64').replace(/[/+=]/g, '_')}_${Date.now()}`;

        return [screenshotBuffer, screenshotId];
      }

      lastError = taskErr;
      logger.warn(`[🛠️ create_webpage_url_screenshot] Attempt ${index + 1} failed for ${url}: ${taskErr.message}`);
      index++;
    } while (index < retryDelays.length);

    throw new CreateWebpageUrlScreenshotError(
      `Failed to capture screenshot after ${index} attempts. Last error: ${lastError?.message}`,
      lastError,
    );
  } finally {
    page.close();
  }
}
