import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckMetricStore } from "./fraud-check-metric-store.js";
import { newFraudCheckMetric } from "./fraud-check-metric.js";

test("MemoryFraudCheckMetricStore finds what it saved", () => {
  const store = newMemoryFraudCheckMetricStore();
  const item = newFraudCheckMetric("code-359", "label-909");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
