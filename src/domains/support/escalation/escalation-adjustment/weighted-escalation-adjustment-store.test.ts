import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedEscalationAdjustmentStore } from "./weighted-escalation-adjustment-store.js";
import { newWeightedEscalationAdjustment } from "./weighted-escalation-adjustment.js";

test("MemoryWeightedEscalationAdjustmentStore finds what it saved", () => {
  const store = newMemoryWeightedEscalationAdjustmentStore();
  const item = newWeightedEscalationAdjustment("code-279", "label-559");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
