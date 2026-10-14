import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelAdjustmentStore } from "./model-adjustment-store.js";
import { newModelAdjustment } from "./model-adjustment.js";

test("MemoryModelAdjustmentStore finds what it saved", () => {
  const store = newMemoryModelAdjustmentStore();
  const item = newModelAdjustment("code-708", "label-25");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
