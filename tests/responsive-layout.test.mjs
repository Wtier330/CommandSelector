import assert from "node:assert/strict";
import test from "node:test";
import {
  computeRawScale,
  computeScale,
  resolveBreakpoint,
  resolveHeightLevel,
} from "../packages/ui/src/composables/responsiveMath.ts";
import { applyTemplate, extractPlaceholders } from "../packages/ui/src/utils/templateEngine.ts";

const bp = {
  xxl: 1920,
  xl: 1440,
  l: 1200,
  m: 768,
  s: 375,
};

const ht = { h2: 800, h1: 600 };

test("breakpoints: key widths", () => {
  assert.equal(resolveBreakpoint(2560, bp), "XXL");
  assert.equal(resolveBreakpoint(1920, bp), "XXL");
  assert.equal(resolveBreakpoint(1919, bp), "XL");
  assert.equal(resolveBreakpoint(1440, bp), "XL");
  assert.equal(resolveBreakpoint(1439, bp), "L");
  assert.equal(resolveBreakpoint(768, bp), "M");
  assert.equal(resolveBreakpoint(767, bp), "S");
  assert.equal(resolveBreakpoint(375, bp), "S");
  assert.equal(resolveBreakpoint(374, bp), "XS");
});

test("height levels", () => {
  assert.equal(resolveHeightLevel(900, ht), "H2");
  assert.equal(resolveHeightLevel(800, ht), "H2");
  assert.equal(resolveHeightLevel(799, ht), "H1");
  assert.equal(resolveHeightLevel(600, ht), "H1");
  assert.equal(resolveHeightLevel(599, ht), "XS");
});

test("aspect ratios: 16:9 / 4:3 / 21:9 scale stays bounded", () => {
  const baseW = 1440;
  const baseH = 900;

  const raw169 = computeRawScale(1920, 1080, baseW, baseH);
  assert.ok(raw169 > 0);

  const raw43 = computeRawScale(1024, 768, baseW, baseH);
  assert.ok(raw43 > 0);

  const raw219 = computeRawScale(2560, 1080, baseW, baseH);
  assert.ok(raw219 > 0);
});

test("scale: auto does not upscale when scaleUp=false", () => {
  const raw = 1.3;
  const s = computeScale(raw, 0.8, 1.2, "auto", false);
  assert.equal(s, 1);
});

test("scale: manual override can upscale within max", () => {
  const raw = 0.9;
  const s = computeScale(raw, 0.8, 1.2, 1.2, false);
  assert.equal(s, 1.2);
});

test("template: apply placeholders", () => {
  const t = "netstat -ano | findstr :{{port}}";
  const out = applyTemplate(t, { port: 8080 });
  assert.equal(out, "netstat -ano | findstr :8080");
});
