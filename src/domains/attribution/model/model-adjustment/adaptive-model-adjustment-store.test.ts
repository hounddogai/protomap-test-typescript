import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveModelAdjustmentStore } from "./adaptive-model-adjustment-store.js";
import { newAdaptiveModelAdjustment } from "./adaptive-model-adjustment.js";

test("MemoryAdaptiveModelAdjustmentStore finds what it saved", () => {
  const store = newMemoryAdaptiveModelAdjustmentStore();
  const item = newAdaptiveModelAdjustment("code-660", "title-96");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
