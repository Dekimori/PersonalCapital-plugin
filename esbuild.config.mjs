import esbuild from "esbuild";

const prod = process.argv.includes("--production");

await esbuild.build({
  entryPoints: ["src/plugin.ts"],
  bundle: true,
  outfile: "main.js",
  format: "cjs",
  platform: "node",
  external: ["obsidian"],
  sourcemap: prod ? false : "inline",
  target: "es2022",
  logLevel: "info",
});
