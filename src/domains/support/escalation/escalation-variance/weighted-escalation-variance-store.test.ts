import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedEscalationVarianceStore } from "./weighted-escalation-variance-store.js";
import { newWeightedEscalationVariance } from "./weighted-escalation-variance.js";

test("MemoryWeightedEscalationVarianceStore finds what it saved", () => {
  const store = newMemoryWeightedEscalationVarianceStore();
  const item = newWeightedEscalationVariance("code-461", "label-53");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
