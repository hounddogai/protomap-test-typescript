import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSlaAdjustmentStore } from "./fallback-sla-adjustment-store.js";
import { newFallbackSlaAdjustment } from "./fallback-sla-adjustment.js";

test("MemoryFallbackSlaAdjustmentStore finds what it saved", () => {
  const store = newMemoryFallbackSlaAdjustmentStore();
  const item = newFallbackSlaAdjustment("code-833", "title-170");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
