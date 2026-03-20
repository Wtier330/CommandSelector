export interface ValidationResult {
  ok: boolean;
  reasons: string[];
}

export function validateCommandText(text: string): ValidationResult {
  const reasons: string[] = [];
  const t = text.trim();

  if (!t) reasons.push("命令为空");

  const unresolved = t.match(/\{\{([A-Za-z0-9_]+)\}\}/g) ?? [];
  if (unresolved.length > 0) {
    const keys = unresolved
      .map((m) => m.slice(2, -2))
      .filter((k) => k.length > 0);
    const uniq = Array.from(new Set(keys)).sort();
    reasons.push(`存在未替换占位符：${uniq.join(", ")}`);
  }

  const quotes = Array.from(t).filter((c) => c === '"').length;
  if (quotes % 2 !== 0) reasons.push('双引号数量为奇数，可能存在未闭合的引号');

  return { ok: reasons.length === 0, reasons };
}
