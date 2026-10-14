import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedWaitAdjustmentStore } from "./capped-wait-adjustment-store.js";
import { newCappedWaitAdjustment } from "./capped-wait-adjustment.js";

test("MemoryCappedWaitAdjustmentStore finds what it saved", () => {
  const store = newMemoryCappedWaitAdjustmentStore();
  const item = newCappedWaitAdjustment("code-817", "title-130");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
