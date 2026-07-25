#!/usr/bin/env node
// Post-build patch: nitro/rolldown splits shared runtime helpers
// (__commonJSMin, __toESM, __require ...) into a chunk that is circularly
// imported by _libs/*.mjs vendor chunks. In production Node ESM, the imported
// binding is `undefined` at first-use time, crashing with:
//   TypeError: __commonJSMin is not a function
//
// Fix: for every .mjs chunk that REFERENCES a helper but does NOT DECLARE it,
// prepend local `var` declarations of all helpers at the very top of the file.
// `var` hoists and shadows the (undefined) imported binding, so the helper is
// defined at first use regardless of module init order.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RUNTIME_HELPERS = `// __lovable_runtime_helpers_patch__
import { createRequire as __nitroCreateRequire__ } from "node:module";
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __getOwnPropNames_LR = Object.getOwnPropertyNames;
var __defProp_LR = Object.defineProperty;
var __getOwnPropDesc_LR = Object.getOwnPropertyDescriptor;
var __getProtoOf_LR = Object.getPrototypeOf;
var __hasOwnProp_LR = Object.prototype.hasOwnProperty;
var __copyProps_LR = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames_LR(from))
      if (!__hasOwnProp_LR.call(to, key) && key !== except)
        __defProp_LR(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc_LR(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? Object.create(__getProtoOf_LR(mod)) : {}, __copyProps_LR(isNodeMode || !mod || !mod.__esModule ? __defProp_LR(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps_LR(__defProp_LR({}, "__esModule", { value: true }), mod);
var __exportAll = (target, all) => { for (var name in all) __defProp_LR(target, name, { get: all[name], enumerable: true }); };
var __require = __nitroCreateRequire__(import.meta.url);
`;

const HELPER_NAMES = ["__commonJSMin", "__esmMin", "__toESM", "__toCommonJS", "__exportAll", "__require"];
const MARKER = "__lovable_runtime_helpers_patch__";

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
let scanned = 0;
for (const file of walk(root)) {
  scanned++;
  let src = readFileSync(file, "utf8");
  if (src.includes(MARKER)) continue; // already patched

  // Does this chunk reference any helper?
  const referenced = HELPER_NAMES.some((h) => new RegExp(`\\b${h}\\b`).test(src));
  if (!referenced) continue;

  // Prepend helpers. `var` hoists and shadows any imported binding of the same
  // name — safe even when the file also imports these from another chunk.
  writeFileSync(file, RUNTIME_HELPERS + "\n" + src);
  patched++;
  console.log("[patch-runtime-helpers] inlined helpers in", file);
}
console.log(`[patch-runtime-helpers] scanned ${scanned} file(s), patched ${patched}`);
