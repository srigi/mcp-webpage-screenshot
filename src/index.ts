import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolve } from 'node:path';
import winston, { transports } from 'winston';

import { version } from '../package.json';
import { schema as fileScreenshotSchema, getHandler as getFileScreenshotHandler } from '~/tools/create_webpage_file_screenshot';

const logger = winston.createLogger({
  level: process.argv.includes('--debug') ? 'debug' : 'info',
  format: winston.format.json({ deterministic: true }),
  transports: [
    new transports.File({
      filename: resolve(__dirname, '..', 'logs', 'mcp.log'),
    }),
  ],
});
const server = new McpServer({ name: 'Webpage screenshot', version });

server.tool(
  'create_webpage_file_screenshot',
  'Create a screenshot of a webpage opened as a local .html file',
  fileScreenshotSchema,
  getFileScreenshotHandler(logger),
);

server.connect(new StdioServerTransport()).then(() => logger.info('server connected'));
