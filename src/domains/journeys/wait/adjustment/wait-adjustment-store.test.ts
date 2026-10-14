import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitAdjustmentStore } from "./wait-adjustment-store.js";
import { newWaitAdjustment } from "./wait-adjustment.js";

test("MemoryWaitAdjustmentStore finds what it saved", () => {
  const store = newMemoryWaitAdjustmentStore();
  const item = newWaitAdjustment("code-549", "name-798");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
