import { getBrowser } from '~/utils/browser';
import { getLogger } from '~/utils/logger';
import { tryCatch } from '~/utils/tryCatch';

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
