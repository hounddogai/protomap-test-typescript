import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackInsightAdjustmentStore } from "./fallback-insight-adjustment-store.js";
import { newFallbackInsightAdjustment } from "./fallback-insight-adjustment.js";

test("MemoryFallbackInsightAdjustmentStore finds what it saved", () => {
  const store = newMemoryFallbackInsightAdjustmentStore();
  const item = newFallbackInsightAdjustment("code-345", "name-231");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
