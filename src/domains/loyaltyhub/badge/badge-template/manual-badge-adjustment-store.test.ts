import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBadgeAdjustmentStore } from "./manual-badge-adjustment-store.js";
import { newManualBadgeAdjustment } from "./manual-badge-adjustment.js";

test("MemoryManualBadgeAdjustmentStore finds what it saved", () => {
  const store = newMemoryManualBadgeAdjustmentStore();
  const item = newManualBadgeAdjustment("code-3", "label-529");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
