import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

import { CreateWebpageUrlScreenshotError, createWebpageUrlScreenshot } from './utils';
import { DEFAULT_VIEWPORT_WIDTH, DEFAULT_VIEWPORT_HEIGHT } from '../util.capture.js';
import { getLogger } from '~/utils/logger';
import { tryCatch } from '~/utils/tryCatch';
import { addScreenshot as addScreenshotResource } from '~/resources/screenshots';

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

  const [webpageUrlScreenshotErr, screenshotResult] = await tryCatch<CreateWebpageUrlScreenshotError, [Buffer, string]>(
    createWebpageUrlScreenshot(url, { viewport, colorScheme }),
  );
  if (webpageUrlScreenshotErr) {
    logger.error(`[🛠️ create_webpage_url_screenshot] ${webpageUrlScreenshotErr.message}`, { error: webpageUrlScreenshotErr });
    return {
      _meta: {
        error: { type: webpageUrlScreenshotErr.constructor.name, message: webpageUrlScreenshotErr.message },
        success: false,
      },
      content: [
        {
          type: 'text' as const,
          text: `Error creating URL screenshot: ${webpageUrlScreenshotErr.message}`,
        },
      ],
    };
  }

  const [screenshotBuffer, mimeType] = screenshotResult;
  const sizeKB = Math.round((screenshotBuffer.length / 1024) * 100) / 100; // size in kB
  const [screenshotUri] = addScreenshotResource(screenshotBuffer, mimeType, url);

  const [writeFileErr] = tryCatch(() => writeFileSync(resolve(workspacePath, screenshotFilePath), screenshotBuffer));
  if (writeFileErr) {
    logger.error(`[🛠️ create_webpage_url_screenshot] ${writeFileErr.message}`, { error: writeFileErr });

    return {
      _meta: {
        error: { type: writeFileErr.constructor.name, message: writeFileErr.message },
        success: false,
      },
      content: [
        {
          type: 'text' as const,
          text: `Error writing screenshot file: ${writeFileErr.message}`,
        },
      ],
    };
  }

  logger.info(`[🛠️ create_webpage_url_screenshot] screenshot saved to ${screenshotFilePath}`, { size: `${sizeKB}kB` });

  return {
    _meta: {
      success: true,
    },
    content: [
      {
        type: 'text',
        text: `Screenshot of ${url} saved to ${screenshotFilePath} (${sizeKB}kB). You can access the screenshot via the resource "${screenshotUri}".`,
      },
    ],
  };
};
