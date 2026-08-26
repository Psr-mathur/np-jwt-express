# Developer & Package Architecture Guide (`DEV.md`)

This document provides a detailed technical explanation of the package configuration, dependency management, TypeScript compilation strategy, and installation behavior for `re-jwt-express`.

---

## 1. Overview & Core Design Philosophy

`re-jwt-express` is designed as a **zero-runtime-overhead, universally compatible Express JWT authentication middleware**.

Key architectural principles:
1. **Zero Express Runtime Lock-in**: The package does not bundle or require `express` at runtime. It only uses Express type definitions during development (`import type`).
2. **Universal Compatibility**: Works with **both Express 4.x and Express 5.x** without version mismatch errors.
3. **Automated Type Emission**: Emits complete TypeScript `.d.ts` declarations on every build, preventing `TS7016: Could not find a declaration file` errors.

---

## 2. Detailed Breakdown of `package.json` Changes

### A. TypeScript Declaration & Entry Points (`main`, `types`, `exports`)

```json
"main": "dist/index.js",
"types": "dist/index.d.ts",
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.js"
  }
}
```

* **`"main": "dist/index.js"`**: Specifies the primary CommonJS entry point for Node.js.
* **`"types": "dist/index.d.ts"`**: Legacy and modern fallback path telling TypeScript where to find the root type declarations.
* **`"exports"`**: Modern Node.js / TypeScript (Node16 / Bundler resolution) conditional export map.
  * **Why `"types"` is listed first**: TypeScript requires the `"types"` key to precede `"import"` or `"require"` so type definitions take precedence during module resolution.

---

### B. The `"files"` Whitelist

```json
"files": [
  "dist"
]
```

* **What it does**: Tells npm to strictly include the `dist` folder (plus mandatory files like `package.json` and `README.md`) in the published tarball (`.tgz`).
* **Why it was added**: By default, `dist/` is listed in `.gitignore`. Without the `"files"` array, `npm publish` might omit the `dist/` folder, causing consumers to install an empty package with missing `.js` and `.d.ts` files.

---

### C. Dependency Separation Strategy

```json
"dependencies": {
  "jsonwebtoken": "^9.0.2",
  "@types/jsonwebtoken": "^9.0.10"
},
"peerDependencies": {
  "@types/express": ">=4.0.0"
},
"peerDependenciesMeta": {
  "@types/express": {
    "optional": true
  }
},
"devDependencies": {
  "@types/express": "^5.0.6",
  "@typescript-eslint/eslint-plugin": "^7.1.0",
  "@typescript-eslint/parser": "^7.1.0",
  "eslint-config-prettier": "^9.1.0"
}
```

#### 1. `dependencies` (Runtime)
* **`jsonwebtoken`**: Required at runtime to sign and verify JWT tokens (`jwt.verify`, `jwt.sign`).
* **`@types/jsonwebtoken`**: Included so TypeScript consumers of `re-jwt-express` automatically get type safety for options like `jwt.SignOptions`.

#### 2. `peerDependencies` & `peerDependenciesMeta` (Type Ecosystem)
* **Why `@types/express` is an optional peer dependency**:
  * Prevents npm from forcing a specific version of `@types/express` on the consumer.
  * Allows the consuming project to use `@types/express@^4.x` or `@types/express@^5.x` without npm throwing peer dependency conflicts.
  * Prevents duplicate `@types/express` installations inside nested `node_modules`.

#### 3. `devDependencies` (Build & Tooling Only)
* **ESLint & Prettier packages**: Moved out of `dependencies` into `devDependencies` so consumers do not download development linters and parsers.
* **`@types/express`**: Used only during local package compilation (`tsc`).

---

### D. Automated Build Hook (`scripts`)

```json
"scripts": {
  "build": "tsc",
  "prepublishOnly": "npm run build"
}
```

* **`"prepublishOnly": "npm run build"`**: A built-in npm lifecycle hook. Whenever `npm publish` is run, npm automatically executes `tsc` first. This guarantees that published packages always contain fresh, compiled `.js` code and `.d.ts` declaration files.

---

## 3. What Happens When a User Installs This Package

When an end-user runs:
```bash
npm install re-jwt-express
```

1. **Lightweight Download**:
   * npm downloads only `re-jwt-express` (the `dist/` bundle) and its sole runtime dependency (`jsonwebtoken`).
   * No developer dependencies (like ESLint, Prettier, or internal compiler tools) are downloaded.
2. **Zero Duplicate Express Installation**:
   * Express is not installed again. The package hooks directly into the host project's existing Express instance.
3. **Instant TypeScript Introspection**:
   * TypeScript immediately resolves types from `dist/index.d.ts` and `dist/funcs/authentication.d.ts`.
   * Middleware usage (`router.use(authenticate(...))` or `app.use(authenticate(...))`) is recognized as a valid Express `RequestHandler`.

---

## 4. Requirements for Consuming Applications

To use `re-jwt-express` in a project, the consuming project needs:

1. **Node.js**: `v16.x` or higher.
2. **Express**: `express` (`v4.x` or `v5.x`).
3. **Cookie Parser (Only if using `mode: 'cookie'`)**:
   Express does not parse cookies by default. If using cookie-based authentication, `cookie-parser` must be installed and registered:
   ```bash
   npm install cookie-parser
   npm install --save-dev @types/cookie-parser
   ```
   ```ts
   import cookieParser from 'cookie-parser';
   app.use(cookieParser());
   ```

---

## 5. Development & Publishing Workflow

To contribute, modify, or release a new version of this package:

```bash
# 1. Install local dependencies
npm install

# 2. Make code changes in index.ts or funcs/

# 3. Build & verify declarations
npm run build

# 4. Bump version in package.json (e.g. 1.0.6)
# npm version patch | minor | major

# 5. Publish to npm registry
npm publish
```
