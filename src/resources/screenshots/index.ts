import { Variables } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';

import { getLogger } from '~/utils/logger';

export class DuplicateScreenshotIdError extends Error {
  name = 'DuplicateScreenshotIdError';
}

export type ScreenshotResource = {
  blob: string;
  mimeType: string;
  text: string;
  uri: string;
};
export const screenshotResources = new Map<number, ScreenshotResource>();

export function addScreenshot(buffer: Buffer, mimeType: string, text: string, screenshotId?: number): [string, ScreenshotResource] {
  const id = screenshotId ?? new Date().getTime();
  if (screenshotResources.has(id)) {
    throw new DuplicateScreenshotIdError(`Screenshot with ID ${id} already exists`);
  }

  const screenshotResource = {
    blob: `data:${mimeType};base64,${buffer.toString('base64')}`,
    mimeType,
    text: `Screenshot of ${text}`,
    uri: `screenshots://${id}`,
  };

  screenshotResources.set(id, screenshotResource);
  getLogger().debug('[📚 screenshots://{id}] addScreenshot(), count:', { screenshotResources: screenshotResources.size });

  return [screenshotResource.uri, screenshotResource];
}

export function handler(uri: URL, variables: Variables) {
  getLogger().debug('[📚 screenshots://{id}] ReadResourceCallback()', { uri, variables });

  if (typeof variables.id !== 'string') {
    return {
      isError: true,
      contents: [{ text: 'Screenshot ID is incorrect or missing!', uri: uri.href }],
    };
  }

  const screenshotResource = screenshotResources.get(parseInt(variables.id, 10));
  if (!screenshotResource) {
    return {
      isError: true,
      contents: [{ text: 'Requested resource not found!', uri: uri.href }],
    };
  }

  return {
    contents: [{ ...screenshotResource }],
  };
}
