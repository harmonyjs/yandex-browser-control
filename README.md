# Yandex Browser Control

A Claude Desktop extension for controlling Yandex Browser. This extension allows you to manage tabs, windows, and navigation directly from the desktop agent.

### Installation

Open Claude Desktop, go to the Extensions tab, and search for "Yandex Browser Control". Click "Install" to add the extension.

Restart Claude Desktop to activate the extension if necessary.

Check out settings to customize the extension behavior.

### Usage

Once installed, you can control Yandex Browser directly through Claude Desktop. 

### Logging

- All logs are emitted to stderr only (never stdout) to comply with MCP over stdio.
- In addition, logs are duplicated to a temp file. The absolute path to this file is printed to stderr on startup, for example:

```
[mcp] logging to file: /var/folders/…/yandex-browser-control.log.12345
```

You can control verbosity with the `LOG_LEVEL` env variable (default: `info`).

### Contributing

If you want to contribute to the development of this extension, here’s how to get started.

**1. Install Dependencies**

```sh
npm install
```

**2. Run in Development Mode**

This command runs the TypeScript source directly using `tsx`.

```sh
npm run dev
```

**3. Code Quality**

Lint and automatically fix code style issues:

```sh
npm run lint
```

**4. Type-Check**

Run the TypeScript compiler to check for type errors without generating output files.

```sh
npm run typecheck
```

**5. Build for Production**

This command compiles the TypeScript code to JavaScript in the `dist` directory.

```sh
npm run build
```

**6. Run the Built Output**

```sh
npm start
```

### Project Structure

-   `src/` — TypeScript source code for the extension.
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

