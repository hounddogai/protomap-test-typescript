import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutAdjustmentStore } from "./opt-out-adjustment-store.js";
import { newOptOutAdjustment } from "./opt-out-adjustment.js";

test("MemoryOptOutAdjustmentStore finds what it saved", () => {
  const store = newMemoryOptOutAdjustmentStore();
  const item = newOptOutAdjustment("code-807", "name-694");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
