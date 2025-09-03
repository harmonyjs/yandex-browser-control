# Yandex Browser Control

An MCP server for controlling Yandex Browser. You can connect it to Claude Desktop (or any MCP-capable host) to manage tabs, windows, and navigation.

Note: macOS only. This extension relies on AppleScript and the Yandex Browser AppleScript dictionary, which are available on macOS.

### Installation

To use as an npm package:

```bash
npm install @avavilov/yandex-browser-control
```

Or use as a Claude Desktop MCP server:

- If distributed via the Claude Desktop Extensions catalog: open Claude Desktop → Extensions and install "Yandex Browser Control" (when available).
- For local development today: add it as a custom MCP server in Claude Desktop.
	- Build or run from source (see Development below).
	- In Claude Desktop, go to Settings → Extensions → Model Context Protocol → Add server (Command), and point it to either:
		- Dev: run command `npm run dev` in this repository directory
		- Prod: run command `node dist/index.js` in this repository directory

### Usage

Once connected, you can control Yandex Browser directly through Claude Desktop.

### Configuration

You can choose which macOS app bundle to control using a setting exposed in Claude Desktop:

- Setting name: app_id
- Default: `ru.yandex.desktop.yandex-browser`
- Where it’s used: passed to the server as environment variable `APP_ID`.

This is useful if you want to target Yandex Browser Beta/Canary or a custom Chromium-based browser that supports the same AppleScript dictionary. Set the bundle identifier accordingly (for example, `ru.yandex.desktop.yandex-browser.beta` if applicable).

For local development or manual runs, you can also set the environment variable directly:

```
APP_ID="ru.yandex.desktop.yandex-browser" npm run dev
```

### Logging

- All logs are emitted to stderr only (never stdout) to comply with MCP over stdio.
- In addition, logs are duplicated to a temp file. The absolute path to this file is printed to stderr on startup, for example:

```
logging to file: /var/folders/…/yandex-browser-control.log.12345
```

You can control verbosity with the `LOG_LEVEL` env variable (default: `info`).

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development, build, and code quality instructions.

### Project Structure

-   `src/` — TypeScript source code for the server.
-   `dist/` — Compiled JavaScript output (generated on build).
-   `src/tools/` — MCP tools, one directory per tool with an `index.ts` that exports metadata, input schema (when needed), handler, and types.

### Tools

- Each tool lives in `src/tools/<tool-name>/index.ts` and should export:
  - `name` and `description` strings
  - `inputSchema` (Zod raw shape) when the tool takes parameters; omit `inputSchema` entirely for no-arg tools
  - `handler` function returning `{ content: [{ type: 'text', text: string }] }` or structured content
  - any `types` (e.g., `Input`, `Output`)
- Register all tools in `src/tools/index.ts` via `registerTools(server)`, which is invoked from `src/index.ts`.

### License

MIT

