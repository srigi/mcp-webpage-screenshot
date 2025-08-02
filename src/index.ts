import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { version } from '../package.json';
import { createLogger } from '~/utils/logger';
import { parseDebugArgs } from '~/utils/cli/parseDebugArgs';
import { tryCatch } from '~/utils/tryCatch';
import { schema as fileScreenshotSchema, handler as fileScreenshotHandler } from '~/tools/create_webpage_file_screenshot';
import { handler as screenshotResourceHandler } from '~/resources/screenshots';

const [parseErr, debugConfig] = tryCatch<Error, ReturnType<typeof parseDebugArgs>>(parseDebugArgs);
if (parseErr != null) {
  console.error('Error parsing the --debug argument(s):', parseErr.message);
  process.exit(1);
}

const logger = createLogger({ debugConfig, prettyPrint: process.argv.includes('--pretty-print') });
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
