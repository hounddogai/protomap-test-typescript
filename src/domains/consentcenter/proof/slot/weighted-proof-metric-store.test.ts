import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedProofMetricStore } from "./weighted-proof-metric-store.js";
import { newWeightedProofMetric } from "./weighted-proof-metric.js";

test("MemoryWeightedProofMetricStore finds what it saved", () => {
  const store = newMemoryWeightedProofMetricStore();
  const item = newWeightedProofMetric("code-778", "name-408");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
