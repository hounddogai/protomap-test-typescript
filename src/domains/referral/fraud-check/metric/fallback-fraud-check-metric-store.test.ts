import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFraudCheckMetricStore } from "./fallback-fraud-check-metric-store.js";
import { newFallbackFraudCheckMetric } from "./fallback-fraud-check-metric.js";

test("MemoryFallbackFraudCheckMetricStore finds what it saved", () => {
  const store = newMemoryFallbackFraudCheckMetricStore();
  const item = newFallbackFraudCheckMetric("code-769", "name-707");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
