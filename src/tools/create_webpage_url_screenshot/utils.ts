import { getBrowser } from '~/utils/browser';
import { delay } from '~/utils/delay';
import { getLogger } from '~/utils/logger';

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

  const page = await browser.newPage({
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
  });

  try {
    // retry logic
    const retryDelays = [5000, 9000, 15000];
    let lastError: Error | undefined;

    let attempt = 0;
    for (; attempt < retryDelays.length; attempt++) {
      try {
        logger.debug(`[🛠️ create_webpage_url_screenshot] Attempt ${attempt + 1} to navigate to ${url}`);

        // Navigate with timeout and wait for network idle
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: retryDelays[attempt],
        });

        // Additional wait for dynamic content
        await page.waitForTimeout(1000);

        const screenshotBuffer = await page.screenshot({ fullPage: options.viewport?.height === 'fullpage', type: 'png' });

        // Generate screenshot ID based on URL and timestamp
        const screenshotId = `url_${Buffer.from(url).toString('base64').replace(/[/+=]/g, '_')}_${Date.now()}`;

        logger.debug(`[🛠️ create_webpage_url_screenshot] Successfully captured screenshot of ${url}`);
        return [screenshotBuffer, screenshotId];
      } catch (error) {
        lastError = error as Error;
        logger.warn(`[🛠️ create_webpage_url_screenshot] Attempt ${attempt + 1} failed for ${url}: ${error}`);

        if (attempt < retryDelays.length - 1) {
          await delay(1000).then(() => attempt++);
        }
      }
    }

    throw new CreateWebpageUrlScreenshotError(
      `Failed to capture screenshot after ${attempt} attempts. Last error: ${lastError?.message}`,
      lastError || undefined,
    );
  } finally {
    await page.close();
  }
}
