#!/usr/bin/env node
// Post-build patch: nitro/rolldown splits shared runtime helpers
// (__commonJSMin, __toESM, __require) into a chunk that ends up circularly
// imported by _libs/*.mjs vendor chunks. In production Node ESM, the imported
// binding is undefined at first-use time, crashing with:
//   TypeError: __commonJSMin is not a function
// Inline the helpers directly into any vendor chunk that imports them.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RUNTIME_HELPERS = `
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? Object.create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __exportAll = (target, all) => { for (var name in all) __defProp(target, name, { get: all[name], enumerable: true }); };
import { createRequire as __nitroCreateRequire } from "node:module";
var __require = __nitroCreateRequire(import.meta.url);
`;

const HELPER_NAMES = ["__commonJSMin", "__esmMin", "__toESM", "__toCommonJS", "__exportAll", "__require"];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".mjs")) out.push(p);
  }
  return out;
}

const root = ".output/server";
let patched = 0;
for (const file of walk(root)) {
  let src = readFileSync(file, "utf8");
  // Match imports like: import { m as __commonJSMin, y as __toESM } from "...";
  const importRe = /^import\s*\{([^}]*)\}\s*from\s*"([^"]+)";?\s*$/gm;
  let changed = false;
  src = src.replace(importRe, (match, specifiers, from) => {
    const specs = specifiers.split(",").map((s) => s.trim()).filter(Boolean);
    const keep = [];
    let hadHelper = false;
    for (const spec of specs) {
      // "m as __commonJSMin" or "__commonJSMin"
      const m = spec.match(/^(?:(\w+)\s+as\s+)?(\w+)$/);
      if (!m) { keep.push(spec); continue; }
      const local = m[2];
      if (HELPER_NAMES.includes(local)) {
        hadHelper = true;
      } else {
        keep.push(spec);
      }
    }
    if (!hadHelper) return match;
    changed = true;
    if (keep.length === 0) return "";
    return `import { ${keep.join(", ")} } from "${from}";`;
  });
  if (changed) {
    // Prepend runtime helpers after any remaining imports at top.
    // Simplest: put helpers right at the very top; hoisted var declarations
    // and the createRequire import are safe before other imports.
    src = RUNTIME_HELPERS + "\n" + src;
    writeFileSync(file, src);
    patched++;
    console.log("[patch-runtime-helpers] inlined helpers in", file);
  }
}
console.log(`[patch-runtime-helpers] patched ${patched} file(s)`);
