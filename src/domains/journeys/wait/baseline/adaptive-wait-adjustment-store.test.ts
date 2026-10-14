import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveWaitAdjustmentStore } from "./adaptive-wait-adjustment-store.js";
import { newAdaptiveWaitAdjustment } from "./adaptive-wait-adjustment.js";

test("MemoryAdaptiveWaitAdjustmentStore finds what it saved", () => {
  const store = newMemoryAdaptiveWaitAdjustmentStore();
  const item = newAdaptiveWaitAdjustment("code-973", "name-187");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
