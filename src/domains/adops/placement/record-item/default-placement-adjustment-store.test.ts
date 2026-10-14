import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPlacementAdjustmentStore } from "./default-placement-adjustment-store.js";
import { newDefaultPlacementAdjustment } from "./default-placement-adjustment.js";

test("MemoryDefaultPlacementAdjustmentStore finds what it saved", () => {
  const store = newMemoryDefaultPlacementAdjustmentStore();
  const item = newDefaultPlacementAdjustment("code-655", "label-587");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
