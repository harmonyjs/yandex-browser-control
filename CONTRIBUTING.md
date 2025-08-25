# Contributing

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

## Debug the server

To debug the MCP server with the Inspector, run:

```sh
npx @modelcontextprotocol/inspector -- tsx src/index.ts
```

This command starts the inspector and launches the server entry at `src/index.ts`.

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
