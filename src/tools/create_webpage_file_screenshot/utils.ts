import { tryCatch } from '~/utils/tryCatch';
import { type CaptureScreenshotOptions, captureScreenshot, createBrowserPage } from '../util.capture';

export class CreateWebpageFileScreenshotError extends Error {
  name = 'CreateWebpageFileScreenshotError';
}

export async function createWebpageFileScreenshot(
  webpageFilePath: string,
  { colorScheme, viewport }: CaptureScreenshotOptions,
): Promise<[Buffer, string]> {
  const [pageErr, page] = await tryCatch(createBrowserPage({ colorScheme, viewport }));
  if (pageErr) {
    throw new CreateWebpageFileScreenshotError(`Failed to create browser page: ${pageErr.message}`, { cause: pageErr });
  }

  const [gotoErr] = await tryCatch(page.goto(`file://${webpageFilePath}`, { waitUntil: 'networkidle' }));
  if (gotoErr) {
    throw new CreateWebpageFileScreenshotError(`Failed to navigate to webpage: ${gotoErr.message}`, { cause: gotoErr });
  }

  const [screenshotErr, screenshotBuffer] = await tryCatch(captureScreenshot(page, { viewport }));
  if (screenshotErr) {
    throw new CreateWebpageFileScreenshotError(`Failed to take screenshot: ${screenshotErr.message}`, { cause: screenshotErr });
  }

  page.close();

  return [screenshotBuffer, 'image/png'];
}
