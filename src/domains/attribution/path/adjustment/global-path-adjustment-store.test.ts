import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalPathAdjustmentStore } from "./global-path-adjustment-store.js";
import { newGlobalPathAdjustment } from "./global-path-adjustment.js";

test("MemoryGlobalPathAdjustmentStore finds what it saved", () => {
  const store = newMemoryGlobalPathAdjustmentStore();
  const item = newGlobalPathAdjustment("code-259", "label-856");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
