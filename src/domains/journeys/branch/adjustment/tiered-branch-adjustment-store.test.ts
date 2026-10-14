import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBranchAdjustmentStore } from "./tiered-branch-adjustment-store.js";
import { newTieredBranchAdjustment } from "./tiered-branch-adjustment.js";

test("MemoryTieredBranchAdjustmentStore finds what it saved", () => {
  const store = newMemoryTieredBranchAdjustmentStore();
  const item = newTieredBranchAdjustment("code-478", "label-795");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
