import { describe, it } from "node:test";
import assert from "node:assert";
import { applyTemplate, extractPlaceholders } from "../src/utils/templateEngine.ts";

describe("templateEngine", () => {
  it("should extract placeholders correctly", () => {
    const template = "ping {{ host }} -t {{ count }}";
    const placeholders = extractPlaceholders(template);
    assert.deepStrictEqual(placeholders, ["host", "count"]);
  });

  it("should apply template with values", () => {
    const template = "ping {{host}} -t {{count}}";
    const values = { host: "127.0.0.1", count: 4 };
    const result = applyTemplate(template, values);
    assert.strictEqual(result, "ping 127.0.0.1 -t 4");
  });

  it("should handle missing values by replacing with empty string", () => {
    const template = "ping {{host}}";
    const result = applyTemplate(template, {});
    assert.strictEqual(result, "ping ");
  });
});
