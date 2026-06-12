import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import type { Alias } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function r(p = "", base = __dirname) {
  return resolve(base, p).replace(/\\/g, "/");
}

function createSubDirAliases(dir: string, prefix = "@") {
  if (!existsSync(dir)) {
    return [];
  }

  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map(({ name }) => ({
        find: `${prefix}/${name}`,
        replacement: `${dir}/${name}`,
      }));
  } catch (error) {
    console.error(`[alias] Error while reading directory "${dir}":`, error);
  }
  return [];
}

export const ROOT_PATH = r();
export const DEMO_PATH = r("demo");

export const viteAlias: readonly Alias[] = [
  ...createSubDirAliases(DEMO_PATH),
  { find: /^#\//, replacement: `${ROOT_PATH}/` },
];
