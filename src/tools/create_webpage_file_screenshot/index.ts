import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

import { CreateWebpageFileScreenshotError, DEFAULT_VIEWPORT_HEIGHT, DEFAULT_VIEWPORT_WIDTH, createWebpageFileScreenshot } from './utils.js';
import { getLogger } from '~/utils/logger';
import { tryCatch } from '~/utils/tryCatch';
import { addScreenshot as addScreenshotResource } from '~/resources/screenshots';

export const schema = {
  screenshotFilePath: z.string().describe('File where to save the screenshot (relative to the current workspace)'),
  webpageFilePath: z.string().describe('HTML file path of the webpage to screenshot (relative to the current workspace)'),
  workspacePath: z.string().describe('The current workspace absolute path'),
  viewport: z
    .object({
      width: z.number().default(DEFAULT_VIEWPORT_WIDTH),
      height: z.union([z.number(), z.literal('fullpage')]).default(DEFAULT_VIEWPORT_HEIGHT),
    })
    .describe(
      `Viewport settings for the screenshot - an object with "width" and "height" properties.
      Width must be a number in pixels.
      Height can be either a number in pixels of literal value "fullpage".
      Not needed for the default viewport size (${DEFAULT_VIEWPORT_WIDTH}×${DEFAULT_VIEWPORT_HEIGHT}px).`,
    )
    .default({ width: DEFAULT_VIEWPORT_WIDTH, height: DEFAULT_VIEWPORT_HEIGHT })
    .optional(),
} as const;

export const handler: ToolCallback<typeof schema> = async ({
  screenshotFilePath: targetFilePath,
  webpageFilePath,
  workspacePath,
  viewport,
}) => {
  const logger = getLogger();
  logger.debug('[🛠️ create_webpage_file_screenshot] handler called', { targetFilePath, webpageFilePath, viewport });

  const fullWebpageFilePath = resolve(workspacePath, webpageFilePath);
  const [webpageFileScreenshotErr, screenshotResult] = await tryCatch<CreateWebpageFileScreenshotError, [Buffer, string]>(
    createWebpageFileScreenshot(fullWebpageFilePath, { viewport }),
  );
  if (webpageFileScreenshotErr) {
    logger.error(`[🛠️ create_webpage_file_screenshot] ${webpageFileScreenshotErr.message}`, { error: webpageFileScreenshotErr });

    return {
      _meta: {
        error: { type: webpageFileScreenshotErr.name, message: webpageFileScreenshotErr.message },
        success: false,
      },
      content: [
        {
          type: 'text' as const,
          text: `create_webpage_file_screenshot error: ${webpageFileScreenshotErr.message}`,
        },
      ],
    };
  }

  const [screenshotBuffer, mimeType] = screenshotResult;
  const size = Math.round((screenshotBuffer.length / 1024) * 100) / 100; // size in kB
  const [screenshotUri] = addScreenshotResource(screenshotBuffer, mimeType, webpageFilePath);

  writeFileSync(resolve(workspacePath, targetFilePath), screenshotBuffer);
  logger.info(`[🛠️ create_webpage_file_screenshot] screenshot saved to ${targetFilePath}`, { size: `${size}kB` });

  return {
    _meta: {
      success: true,
    },
    content: [
      {
        type: 'text' as const,
        text: `Screenshot created and saved to ${targetFilePath} (${size}kB). Screenshot resource available at URI ${screenshotUri}`,
      },
    ],
  };
};
