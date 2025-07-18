import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Logger } from 'winston';
import { z } from 'zod';

import { CreateWebpageFileScreenshotError, getUtils } from './utils.js';
import { tryCatch } from '~/utils/tryCatch.js';

export const schema = {
  webpageFilePath: z.string().describe('File path of the webpage to screenshot (relative to the current workspace)'),
  targetPath: z.string().describe('File where to save the image (relative to the current workspace)'),
  workspacePath: z.string().describe('The current workspace absolute path'),
} as const;

export function getHandler(logger: Logger) {
  const { createWebpageFileScreenshot } = getUtils(logger);

  const handler: ToolCallback<typeof schema> = async ({ targetPath, webpageFilePath, workspacePath }) => {
    logger.debug('[create_webpage_file_screenshot] handler called', { targetPath, webpageFilePath });

    const fullWebpageFilePath = resolve(workspacePath, webpageFilePath);
    const [webpageFileScreenshotErr, screenshotBuffer] = await tryCatch<CreateWebpageFileScreenshotError, Buffer>(
      createWebpageFileScreenshot(fullWebpageFilePath, { width: 1280, height: 720 }),
    );
    if (webpageFileScreenshotErr) {
      logger.error(`[create_webpage_file_screenshot]: ${webpageFileScreenshotErr.message}`, { error: webpageFileScreenshotErr });

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

    // Save the screenshot to the target path
    writeFileSync(resolve(workspacePath, targetPath), screenshotBuffer);
    const size = Math.round((screenshotBuffer.length / 1024) * 100) / 100; // size in kB
    logger.info(`[create_webpage_file_screenshot] screenshot saved to ${targetPath}`, { size: `${size}kB` });

    return {
      _meta: {
        success: true,
      },
      content: [
        {
          type: 'text' as const,
          text: `screenshot saved to ${targetPath} (${size}kB)`,
        },
      ],
    };
  };

  return handler;
}
