import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
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

  const handler: ToolCallback<typeof schema> = async ({ webpageFilePath, targetPath }) => {
    logger.debug('[create_webpage_file_screenshot] handler called', { webpageFilePath, targetPath });

    const [webpageFileScreenshotErr, screenshotBuffer] = await tryCatch<CreateWebpageFileScreenshotError, Buffer>(
      createWebpageFileScreenshot(webpageFilePath),
    );
    if (webpageFileScreenshotErr != null) {
      logger.error(`[create_webpage_file_screenshot]: ${webpageFileScreenshotErr.message}`);

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

    return {
      _meta: {
        success: true,
      },
      content: [
        {
          type: 'text' as const,
          text: `Image saved; ${screenshotBuffer.length} bytes at ${targetPath}`,
        },
      ],
    };
  };

  return handler;
}
