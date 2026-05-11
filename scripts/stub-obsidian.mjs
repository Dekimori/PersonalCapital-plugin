// Writes a runtime CJS stub into node_modules/obsidian so test code that
// transitively `require('obsidian')` can run outside Obsidian. The published
// `obsidian` package ships only `.d.ts` types (its package.json has main: "").
// Production builds mark obsidian as external — esbuild keeps the require()
// call literal and Obsidian provides the real module at runtime.

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const target = resolve(__dirname, "../node_modules/obsidian/index.js");

if (!existsSync(dirname(target))) {
  console.warn(`[stub-obsidian] node_modules/obsidian missing — skipping`);
  process.exit(0);
}

const stub = `// Auto-generated test stub — see scripts/stub-obsidian.mjs
"use strict";

class Notice { constructor() {} hide() {} }
class TFile {}
class TFolder {}
class Plugin {}
class Modal {}
class Setting {}
class PluginSettingTab {}
class ItemView {}
class Component {}
class MarkdownView {}
class Menu {}
class MenuItem {}

const normalizePath = (p) => p;
const requestUrl = async () => ({ status: 200, json: {}, text: "" });
const moment = () => ({ format: () => "" });

module.exports = {
  Notice, TFile, TFolder, Plugin, Modal, Setting, PluginSettingTab,
  ItemView, Component, MarkdownView, Menu, MenuItem,
  normalizePath, requestUrl, moment,
};
`;

writeFileSync(target, stub);
console.log(`[stub-obsidian] wrote ${target}`);
