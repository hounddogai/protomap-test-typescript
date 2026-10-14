import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSuppressionMappingStore } from "./fallback-suppression-mapping-store.js";
import { newFallbackSuppressionMapping } from "./fallback-suppression-mapping.js";

test("MemoryFallbackSuppressionMappingStore finds what it saved", () => {
  const store = newMemoryFallbackSuppressionMappingStore();
  const item = newFallbackSuppressionMapping("code-49", "label-445");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
