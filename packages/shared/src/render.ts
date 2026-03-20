export function renderTemplate(
  template: string,
  values: Record<string, string>
): { rendered: string; missingKeys: string[] } {
  const missing = new Set<string>();
  const rendered = template.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (_m, key) => {
    const v = values[key];
    if (v === undefined || v === null || v === "") {
      missing.add(key);
      return `{{${key}}}`;
    }
    return v;
  });

  const missingKeys = Array.from(missing).sort();
  return { rendered, missingKeys };
}

export function findUnresolvedPlaceholders(text: string): string[] {
  const matches = text.match(/\{\{([A-Za-z0-9_]+)\}\}/g) ?? [];
  const keys = matches
    .map((m) => m.slice(2, -2))
    .filter((k) => k.length > 0);
  return Array.from(new Set(keys)).sort();
}
