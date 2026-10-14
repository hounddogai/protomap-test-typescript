import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveSuppressionMappingStore } from "./adaptive-suppression-mapping-store.js";
import { newAdaptiveSuppressionMapping } from "./adaptive-suppression-mapping.js";

test("MemoryAdaptiveSuppressionMappingStore finds what it saved", () => {
  const store = newMemoryAdaptiveSuppressionMappingStore();
  const item = newAdaptiveSuppressionMapping("code-447", "name-341");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
