import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionAdjustmentStore } from "./retention-adjustment-store.js";
import { newRetentionAdjustment } from "./retention-adjustment.js";

test("MemoryRetentionAdjustmentStore finds what it saved", () => {
  const store = newMemoryRetentionAdjustmentStore();
  const item = newRetentionAdjustment("code-922", "title-705");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
