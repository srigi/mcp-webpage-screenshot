import { Variables } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';

import { getLogger } from '~/logger';

export type ScreenshotResource = {
  blob: string;
  mimeType: string;
  text: string;
  uri: string;
};

export const screenshotResources = new Map<number, ScreenshotResource>();

export function getHandler() {
  return (uri: URL, variables: Variables) => {
    getLogger().debug('[📚 screenshots://{screenshotId}] ReadResourceCallback()', { uri, variables });

    if (typeof variables.screenshotId !== 'string') {
      return {
        isError: true,
        contents: [{ text: 'Screenshot ID is incorrect or missing!', uri: uri.href }],
      };
    }

    const screenshotId = parseInt(decodeURIComponent(variables.screenshotId), 10);
    const screenshotResource = screenshotResources.get(screenshotId);
    if (!screenshotResource) {
      return {
        isError: true,
        contents: [{ text: 'Requested resource not found!', uri: uri.href }],
      };
    }

    return {
      contents: [{ ...screenshotResource }],
    };
  };
}

export function addScreenshot(buffer: Buffer, mimeType: string, webpageScreenshotUri: string) {
  const screenshotId = new Date().getTime();
  const screenshotResource = {
    blob: `data:${mimeType};base64,${buffer.toString('base64')}`,
    mimeType,
    text: webpageScreenshotUri,
    uri: `screenshots://${screenshotId}`,
  };

  screenshotResources.set(screenshotId, screenshotResource);
  getLogger().debug('[📚 screenshots://{screenshotId}] addScreenshot()', { screenshotResources: screenshotResources.size });

  return [screenshotResource.uri, screenshotResource];
}
