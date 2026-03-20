export function extractPlaceholders(template: string) {
  const keys = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) {
    keys.add(m[1]);
  }
  return Array.from(keys);
}

export function applyTemplate(
  template: string,
  values: Record<string, string | number | boolean>
) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g, (_all, key: string) => {
    const v = values[key];
    if (v === undefined || v === null) return "";
    return String(v);
  });
}
