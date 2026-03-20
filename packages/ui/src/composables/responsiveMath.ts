export type Breakpoint = "XXL" | "XL" | "L" | "M" | "S" | "XS";

export type HeightLevel = "H2" | "H1" | "XS";

export type Breakpoints = {
  xxl: number;
  xl: number;
  l: number;
  m: number;
  s: number;
};

export type HeightThresholds = {
  h2: number;
  h1: number;
};

export function clamp(min: number, value: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function resolveBreakpoint(width: number, bp: Breakpoints): Breakpoint {
  if (width >= bp.xxl) return "XXL";
  if (width >= bp.xl) return "XL";
  if (width >= bp.l) return "L";
  if (width >= bp.m) return "M";
  if (width >= bp.s) return "S";
  return "XS";
}

export function resolveHeightLevel(height: number, ht: HeightThresholds): HeightLevel {
  if (height >= ht.h2) return "H2";
  if (height >= ht.h1) return "H1";
  return "XS";
}

export function computeRawScale(
  width: number,
  height: number,
  baseWidth: number,
  baseHeight: number
) {
  const rw = width > 0 ? width / baseWidth : 1;
  const rh = height > 0 ? height / baseHeight : 1;
  return Math.min(rw, rh);
}

export function computeScale(
  rawScale: number,
  scaleMin: number,
  scaleMax: number,
  scaleOverride: "auto" | number | undefined,
  scaleUp: boolean
) {
  if (scaleOverride === "auto" || scaleOverride === undefined) {
    const s = clamp(scaleMin, rawScale, scaleMax);
    return !scaleUp && s > 1 ? 1 : s;
  }
  if (typeof scaleOverride === "number" && Number.isFinite(scaleOverride)) {
    return clamp(scaleMin, scaleOverride, scaleMax);
  }
  const s = clamp(scaleMin, rawScale, scaleMax);
  return !scaleUp && s > 1 ? 1 : s;
}
