import { computed, isRef, onBeforeUnmount, onMounted, ref, type Ref } from "vue";
import {
  computeRawScale,
  computeScale,
  resolveBreakpoint,
  resolveHeightLevel,
  type Breakpoint,
  type Breakpoints,
  type HeightLevel,
  type HeightThresholds,
} from "./responsiveMath";

export type { Breakpoint, Breakpoints, HeightLevel, HeightThresholds };

export type ScaleOverride = "auto" | number;

export type ResponsiveOptions = {
  minWidth?: number;
  minHeight?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleUp?: boolean;
  baseWidth?: number;
  baseHeight?: number;
  scaleOverride?: ScaleOverride;
  breakpoints?: Breakpoints;
  heightThresholds?: HeightThresholds;
  debounceMs?: number;
};

export function useResponsiveLayout(
  target: Ref<HTMLElement | null>,
  options?: ResponsiveOptions | Ref<ResponsiveOptions>
) {
  const opt = computed(() => (isRef(options) ? options.value : options));
  const minWidth = computed(() => opt.value?.minWidth ?? 800);
  const minHeight = computed(() => opt.value?.minHeight ?? 600);

  const scaleMin = computed(() => opt.value?.scaleMin ?? 0.8);
  const scaleMax = computed(() => opt.value?.scaleMax ?? 1.2);
  const scaleUp = computed(() => opt.value?.scaleUp ?? false);

  const baseWidth = computed(() => opt.value?.baseWidth ?? 1440);
  const baseHeight = computed(() => opt.value?.baseHeight ?? 900);

  const bp = computed<Breakpoints>(() =>
    opt.value?.breakpoints ?? {
      xxl: 1920,
      xl: 1440,
      l: 1200,
      m: 768,
      s: 375,
    }
  );

  const ht = computed<HeightThresholds>(() =>
    opt.value?.heightThresholds ?? {
      h2: 800,
      h1: 600,
    }
  );

  const debounceMs = computed(() => opt.value?.debounceMs ?? 60);

  const width = ref(0);
  const height = ref(0);

  let ro: ResizeObserver | null = null;
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingRect: { width: number; height: number } | null = null;
  let winRaf = 0;

  function commitSize() {
    if (!pendingRect) return;
    const nextW = Math.max(0, Math.round(pendingRect.width));
    const nextH = Math.max(0, Math.round(pendingRect.height));
    pendingRect = null;
    width.value = nextW;
    height.value = nextH;
  }

  function scheduleCommit() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = 0;
      commitSize();
    });
  }

  function scheduleUpdate(entry: ResizeObserverEntry) {
    const rect = entry.contentRect;
    pendingRect = { width: rect.width, height: rect.height };

    const ms = debounceMs.value;
    if (ms <= 0) {
      scheduleCommit();
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      scheduleCommit();
    }, ms);
  }

  function refresh() {
    const el = target.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pendingRect = { width: rect.width, height: rect.height };
    scheduleCommit();
  }

  function onWindowResize() {
    if (winRaf) cancelAnimationFrame(winRaf);
    winRaf = requestAnimationFrame(() => {
      winRaf = 0;
      refresh();
    });
  }

  onMounted(() => {
    const el = target.value;
    if (!el) return;
    ro = new ResizeObserver((entries) => {
      const first = entries[0];
      if (!first) return;
      scheduleUpdate(first);
    });
    ro.observe(el);
    refresh();
    window.addEventListener("resize", onWindowResize, { passive: true });
    window.addEventListener("orientationchange", onWindowResize, { passive: true });
    window.addEventListener("visibilitychange", onWindowResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onWindowResize, { passive: true });
  });

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (winRaf) cancelAnimationFrame(winRaf);
    winRaf = 0;
    if (timer) clearTimeout(timer);
    timer = null;
    pendingRect = null;
    if (ro) ro.disconnect();
    ro = null;
    window.removeEventListener("resize", onWindowResize);
    window.removeEventListener("orientationchange", onWindowResize);
    window.removeEventListener("visibilitychange", onWindowResize);
    window.visualViewport?.removeEventListener("resize", onWindowResize);
  });

  const breakpoint = computed<Breakpoint>(() => {
    return resolveBreakpoint(width.value, bp.value);
  });

  const heightLevel = computed<HeightLevel>(() => {
    return resolveHeightLevel(height.value, ht.value);
  });

  const isTooSmall = computed(
    () => width.value < minWidth.value || height.value < minHeight.value
  );

  const rawScale = computed(() => {
    return computeRawScale(
      width.value,
      height.value,
      baseWidth.value,
      baseHeight.value
    );
  });

  const scale = computed(() => {
    const override = opt.value?.scaleOverride;
    return computeScale(
      rawScale.value,
      scaleMin.value,
      scaleMax.value,
      override,
      scaleUp.value
    );
  });

  return {
    width,
    height,
    breakpoint,
    heightLevel,
    isTooSmall,
    rawScale,
    scale,
    refresh,
  };
}
