import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedReputationAdjustmentStore } from "./weighted-reputation-adjustment-store.js";
import { newWeightedReputationAdjustment } from "./weighted-reputation-adjustment.js";

test("MemoryWeightedReputationAdjustmentStore finds what it saved", () => {
  const store = newMemoryWeightedReputationAdjustmentStore();
  const item = newWeightedReputationAdjustment("code-679", "name-89");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
