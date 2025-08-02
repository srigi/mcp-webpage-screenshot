# Webpage Screenshot MCP

<img src="https://i.postimg.cc/LRfcTXD9/Chat-GPT-Image-Aug-2-2025-06-52-39-PM.webp" width="50%" alt="Webpage Screenshot MCP">

Capture screenshots of local `.html` files using Playwright Chromium.
Each capture is saved to disk and exposed as a [Resource](https://modelcontextprotocol.io/specification/2025-06-18/server/resources) with URI scheme `screenshots://{screenshotId}`, that compatible MCP clients can read.

## Usage & Requirements

### Requirements

- Node.js v20+

### Configure MCP in your IDE

Add the following configuration to your MCP settings:

```json
{
  "mcpServers": {
    "webpageScreenshot": {
      "command": "npx",
      "args": ["-y", "@srigi/mcp-webpage-screenshot"],
      "autoApprove": ["create_webpage_file_screenshot"]
    }
  }
}
```

## Usage examples

Prompts you can try:

1. Create a full-page screenshot of `example/page.html` and save it alongside.
2. Make a second screenshot with viewport width 640 and height 1280px.

## Logging

You can configure logging by adding flags to the `args` array in your MCP configuration:

```json
"webpageScreenshot": {
  "command": "npx",
  "args": [
    "-y", "@srigi/mcp-webpage-screenshot",
    "--debug", "/absolute/path/to/debug.log",
    "--pretty-print"
  ]
}
```

Debug flags:

- No `--debug`: logging disabled
- `--debug`: writes to `debug.log` in the current working directory of the running MCP
- `--debug /absolute/path/to/debug.log`: writes logs to that absolute path (absolute paths only)
- `--pretty-print`: pretty formatted JSON logs

## 🛠️ Tools & Resources

### Tool: `create_webpage_file_screenshot`

Create a screenshot of a local HTML file:

- loads the local HTML via `file://`
- waits for `networkidle`
- captures PNG (Buffer), supports full-page height
- saves the image to a workspace-relative path
- adds an in-memory Resource entry and returns a `screenshots://` URI

Parameters:

- `screenshotFilePath`: File where to save the screenshot (relative to the current workspace)
- `webpageFilePath`: HTML file path of the webpage to screenshot (relative to the current workspace)
- `workspacePath`: The current workspace absolute path
- `viewport` (optional):
  - `width: number` (default 1280)
  - `height: number | "fullpage"` (default 768). Use `"fullpage"` to capture the entire page height.

_Security constraints: all paths are resolved relative to `workspacePath`_

### Resource: `screenshots://{screenshotId}`

Each created screenshot is added to an in-memory registry and exposed as a Resource with:

- `uri`: `screenshots://<screenshotId>`
- `blob`: `data:image/png;base64,...`
- `mimeType`: `image/png`
- `text`: original webpage file path used for the screenshot

Note:

- Listing resources is not implemented (list is not available).

## Development

### Requirements

- Node.js v20+
- PNPM v10

The install step will _post-install_ Playwright Chromium, but it's not guaranteed to work. To ensure the shell browser is installed, run:

```
pnpm playwright install --with-deps --only-shell chromium
```

### Steps

1. Install dependencies:
   ```
   pnpm install
   ```
2. Start the TypeScript compiler in watch mode:
   ```
   pnpm dev
   ```
3. (Optional) Start the MCP Inspector:
   ```
   pnpm dev:inspector
   ```
4. Update your MCP configuration for development (adjust the path to the compiled JS):
   ```json
   {
     "mcpServers": {
       "webpageScreenshot": {
         "command": "node",
         "args": ["/absolute/path/to/compiled/src/index.js", "--debug", "--pretty-print"],
         "autoApprove": ["create_webpage_file_screenshot"]
       }
     }
   }
   ```

Notes:

- Restart the MCP in your IDE after source changes to pick up newly compiled code.
