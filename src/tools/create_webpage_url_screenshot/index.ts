import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

import { CreateWebpageUrlScreenshotError, createWebpageUrlScreenshot } from './utils';
import { DEFAULT_VIEWPORT_WIDTH, DEFAULT_VIEWPORT_HEIGHT } from '../util.capture.js';
import { addScreenshot as addScreenshotResource } from '~/resources/screenshots';
import { getLogger } from '~/utils/logger';
import { tryCatch } from '~/utils/tryCatch';
import { respondError, respondSuccess } from '../util.mcpRespond';

export const schema = {
  screenshotFilePath: z.string().describe('File where to save the screenshot (relative to the current workspace)'),
  url: z.string().url().describe('URL of the webpage to screenshot'),
  workspacePath: z.string().describe('The current workspace absolute path'),
  viewport: z
    .object({
      width: z.number().default(DEFAULT_VIEWPORT_WIDTH),
      height: z.union([z.number(), z.literal('fullpage')]).default(DEFAULT_VIEWPORT_HEIGHT),
    })
    .optional()
    .describe(
      `Viewport settings for the screenshot - an object with "width" and "height" properties.
    Width must be a number in pixels.
    Height can be either a number in pixels of literal value "fullpage".
    Not needed for the default viewport size (${DEFAULT_VIEWPORT_WIDTH}×${DEFAULT_VIEWPORT_HEIGHT}px).`,
    )
    .default({ width: DEFAULT_VIEWPORT_WIDTH, height: DEFAULT_VIEWPORT_HEIGHT }),
  colorScheme: z
    .union([z.literal('light'), z.literal('dark'), z.literal('no-preference')])
    .optional()
    .nullable()
    .default(null)
    .describe('Color scheme to use for the screenshot'),
} as const;

export const handler: ToolCallback<typeof schema> = async ({ screenshotFilePath, url, workspacePath, viewport, colorScheme = null }) => {
  const logger = getLogger();
  logger.debug('[🛠️ create_webpage_url_screenshot] handler called', { screenshotFilePath, url, viewport, colorScheme });

  const [screenshotErr, screenshotResult] = await tryCatch<CreateWebpageUrlScreenshotError, [Buffer, string]>(
    createWebpageUrlScreenshot(url, { viewport, colorScheme }),
  );
  if (screenshotErr) {
    return respondError(screenshotErr, '[🛠️ create_webpage_url_screenshot]');
  }

  const [screenshotBuffer, mimeType] = screenshotResult;
  const sizeKB = Math.round((screenshotBuffer.length / 1024) * 100) / 100; // size in kB

  const [addResourceErr, resourceResult] = tryCatch(() => addScreenshotResource(screenshotBuffer, mimeType, url));
  if (addResourceErr) {
    return respondError(addResourceErr, '[🛠️ create_webpage_url_screenshot]');
  }

  const [screenshotUri] = resourceResult;
  const [writeFileErr] = tryCatch(() => writeFileSync(resolve(workspacePath, screenshotFilePath), screenshotBuffer));
  if (writeFileErr) {
    return respondError(writeFileErr, '[🛠️ create_webpage_url_screenshot]');
  }

  return respondSuccess(
    `URL screenshot captured to ${screenshotFilePath} (${sizeKB}kB). Screenshot resource available at URI ${screenshotUri}.`,
    '[🛠️ create_webpage_url_screenshot]',
  );
};
