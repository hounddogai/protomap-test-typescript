import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchAdjustmentStore } from "./branch-adjustment-store.js";
import { newBranchAdjustment } from "./branch-adjustment.js";

test("MemoryBranchAdjustmentStore finds what it saved", () => {
  const store = newMemoryBranchAdjustmentStore();
  const item = newBranchAdjustment("code-828", "name-884");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
