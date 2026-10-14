import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckEstimateStore } from "./fraud-check-estimate-store.js";
import { newFraudCheckEstimate } from "./fraud-check-estimate.js";

test("MemoryFraudCheckEstimateStore finds what it saved", () => {
  const store = newMemoryFraudCheckEstimateStore();
  const item = newFraudCheckEstimate("code-932", "name-145");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
