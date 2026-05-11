// Stub for the `obsidian` module, swapped in via vitest resolve alias.
// Provides minimal shapes for test-time imports — not a full Obsidian API.

export class Notice {
  constructor(_msg?: string, _duration?: number) {}
  hide() {}
}
export class TFile {}
export class TFolder {}
export class Plugin {}
export class Modal {}
export class Setting {}
export class PluginSettingTab {}
export class ItemView {}
export class Component {}
export class MarkdownView {}
export class Menu {}
export class MenuItem {}

export const normalizePath = (p: string) => p;
export const requestUrl = async () => ({ status: 200, json: {}, text: "" });
export const moment = () => ({ format: (_fmt: string) => "" });
