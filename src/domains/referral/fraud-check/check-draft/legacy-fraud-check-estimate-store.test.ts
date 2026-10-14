import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFraudCheckEstimateStore } from "./legacy-fraud-check-estimate-store.js";
import { newLegacyFraudCheckEstimate } from "./legacy-fraud-check-estimate.js";

test("MemoryLegacyFraudCheckEstimateStore finds what it saved", () => {
  const store = newMemoryLegacyFraudCheckEstimateStore();
  const item = newLegacyFraudCheckEstimate("code-27", "name-408");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
