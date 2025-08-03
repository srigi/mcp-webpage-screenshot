import type { Page } from 'playwright';
import { getBrowser } from './utils.browser';
import { tryCatch } from '~/utils/tryCatch';

class CaptureScreenshotError extends Error {
  name = 'CaptureScreenshotError';
}

class CreateBrowserPageError extends Error {
  name = 'CreateBrowserPageError';
}

type BrowserPageOptions = {
  acceptDownloads?: boolean;
  bypassCSP?: boolean;
  colorScheme: 'light' | 'dark' | 'no-preference' | null;
  extraHTTPHeaders?: { [key: string]: string };
  ignoreHTTPSErrors?: boolean;
  javaScriptEnabled?: boolean;
  viewport?: {
    width: number;
    height: number | 'fullpage';
  };
};

export type CaptureScreenshotOptions = Pick<BrowserPageOptions, 'colorScheme' | 'viewport'>;
export const DEFAULT_VIEWPORT_WIDTH = 1280;
export const DEFAULT_VIEWPORT_HEIGHT = 768;

export async function captureScreenshot(page: Page, { viewport }: Pick<BrowserPageOptions, 'viewport'>) {
  const [screenshotErr, screenshotBuffer] = await tryCatch(page.screenshot({ fullPage: viewport?.height === 'fullpage', type: 'png' }));
  if (screenshotErr) {
    throw new CaptureScreenshotError('Failed to capture screenshot', screenshotErr);
  }

  return screenshotBuffer;
}

export async function createBrowserPage({ colorScheme, viewport }: BrowserPageOptions) {
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
    throw new CreateBrowserPageError('Failed to create browser page', pageErr);
  }

  return page;
}
