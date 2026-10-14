import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckVarianceStore } from "./fraud-check-variance-store.js";
import { newFraudCheckVariance } from "./fraud-check-variance.js";

test("MemoryFraudCheckVarianceStore finds what it saved", () => {
  const store = newMemoryFraudCheckVarianceStore();
  const item = newFraudCheckVariance("code-367", "label-174");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
