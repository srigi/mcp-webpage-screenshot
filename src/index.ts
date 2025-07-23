import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolve } from 'node:path';
import winston, { transports } from 'winston';

import { version } from '../package.json';
import { schema as fileScreenshotSchema, handler as fileScreenshotHandler } from '~/tools/create_webpage_file_screenshot';
import { handler as screenshotResourceHandler } from '~/resources/screenshots';
import { createLogger } from '~/logger';

const logger = createLogger({
  level: process.argv.includes('--debug') ? 'debug' : 'info',
  format: winston.format.json({ deterministic: true }),
  transports: [
    new transports.File({
      filename: resolve(__dirname, '..', 'logs', 'mcp.log'),
    }),
  ],
});
const server = new McpServer({ name: 'Webpage screenshot', version });

server.resource(
  'Resources of captured screenshots',
  new ResourceTemplate('screenshots://{screenshotId}', { list: undefined }),
  screenshotResourceHandler,
);
server.tool(
  'create_webpage_file_screenshot',
  'Create a screenshot of a webpage opened as a local .html file',
  fileScreenshotSchema,
  fileScreenshotHandler,
);

server.connect(new StdioServerTransport()).then(() => logger.info('server connected'));
