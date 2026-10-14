import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedFraudCheckQuotaStore } from "./weighted-fraud-check-quota-store.js";
import { newWeightedFraudCheckQuota } from "./weighted-fraud-check-quota.js";

test("MemoryWeightedFraudCheckQuotaStore finds what it saved", () => {
  const store = newMemoryWeightedFraudCheckQuotaStore();
  const item = newWeightedFraudCheckQuota("code-872", "label-759");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
