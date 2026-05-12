// Read the locally installed Obsidian version (macOS only) and write it
// to manifest.testedWithObsidian. Run with `npm run mark-tested` after
// verifying the plugin against a new Obsidian release. The README badge
// picks the new value up live via shields.io.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(__dirname, "../manifest.json");

const PLIST = "/Applications/Obsidian.app/Contents/Info.plist";
let version;
try {
  version = execSync(`defaults read ${PLIST} CFBundleShortVersionString`, {
    encoding: "utf8",
  }).trim();
} catch (e) {
  console.error(`Could not read Obsidian version from ${PLIST}`);
  console.error("Install Obsidian to /Applications, or edit manifest.json by hand.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const prev = manifest.testedWithObsidian;
manifest.testedWithObsidian = version;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`testedWithObsidian: ${prev ?? "(unset)"} -> ${version}`);
