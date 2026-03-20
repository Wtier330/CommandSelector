import { describe, it } from "node:test";
import assert from "node:assert";
import { ref } from "vue";
import { useCommandFilter } from "../src/composables/useCommandFilter.ts";

describe("useCommandFilter", () => {
  it("should filter commands by keyword and category", () => {
    const commands = ref([
      { id: "1", name: "System Info", category: "System", template: "sysinfo" },
      { id: "2", name: "Network Status", category: "Network", template: "netstat" },
      { id: "3", name: "Clear Temp", category: "System", template: "del temp" },
    ]);

    const { keyword, selectedCategories, categories, filteredCommands } = useCommandFilter(commands as any);

    // Test categories
    assert.deepStrictEqual(categories.value, ["Network", "System"]);

    // Test default all commands
    assert.strictEqual(filteredCommands.value.length, 3);

    // Test category filter (single)
    selectedCategories.value = ["System"];
    assert.strictEqual(filteredCommands.value.length, 2);
    assert.strictEqual(filteredCommands.value[0].id, "1");

    // Test category filter (multiple)
    selectedCategories.value = ["System", "Network"];
    assert.strictEqual(filteredCommands.value.length, 3);

    // Test empty category (none selected)
    selectedCategories.value = ["__none__"];
    assert.strictEqual(filteredCommands.value.length, 0);

    // Test keyword filter
    selectedCategories.value = ["__all__"];
    keyword.value = "temp";
    assert.strictEqual(filteredCommands.value.length, 1);
    assert.strictEqual(filteredCommands.value[0].id, "3");
  });
});
