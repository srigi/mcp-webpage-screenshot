import { getBrowser } from '~/utils/browser';
import { tryCatch } from '~/utils/tryCatch';

export class CreateWebpageFileScreenshotError extends Error {
  name = 'CreateWebpageFileScreenshotError';
}

type Options = {
  colorScheme: 'light' | 'dark' | 'no-preference' | null;
  viewport?: {
    width: number;
    height: number | 'fullpage';
  };
};

export const DEFAULT_VIEWPORT_WIDTH = 1280;
export const DEFAULT_VIEWPORT_HEIGHT = 768;

export async function createWebpageFileScreenshot(webpageFilePath: string, { colorScheme, viewport }: Options): Promise<[Buffer, string]> {
  const browser = await getBrowser();
  const [pageErr, page] = await tryCatch(
    browser.newPage({
      colorScheme,
      viewport: {
        width: viewport?.width || DEFAULT_VIEWPORT_WIDTH,
        height: typeof viewport?.height === 'number' ? viewport.height : DEFAULT_VIEWPORT_HEIGHT,
      },
    }),
  );
  if (pageErr) {
    throw new CreateWebpageFileScreenshotError(`Failed to create browser page: ${pageErr.message}`, { cause: pageErr });
  }

  const [gotoErr] = await tryCatch(page.goto(`file://${webpageFilePath}`, { waitUntil: 'networkidle' }));
  if (gotoErr) {
    throw new CreateWebpageFileScreenshotError(`Failed to navigate to webpage: ${gotoErr.message}`, { cause: gotoErr });
  }

  const [screenshotErr, screenshotBuffer] = await tryCatch(page.screenshot({ fullPage: viewport?.height === 'fullpage', type: 'png' }));
  if (screenshotErr) {
    throw new CreateWebpageFileScreenshotError(`Failed to take screenshot: ${screenshotErr.message}`, { cause: screenshotErr });
  }

  return [screenshotBuffer, 'image/png'];
}
