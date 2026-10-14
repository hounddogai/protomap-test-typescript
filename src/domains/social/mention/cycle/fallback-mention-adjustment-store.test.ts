import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackMentionAdjustmentStore } from "./fallback-mention-adjustment-store.js";
import { newFallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

test("MemoryFallbackMentionAdjustmentStore finds what it saved", () => {
  const store = newMemoryFallbackMentionAdjustmentStore();
  const item = newFallbackMentionAdjustment("code-173", "label-273");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
