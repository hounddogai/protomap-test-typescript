import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedFrequencyMetricStore } from "./batched-frequency-metric-store.js";
import { newBatchedFrequencyMetric } from "./batched-frequency-metric.js";

test("MemoryBatchedFrequencyMetricStore finds what it saved", () => {
  const store = newMemoryBatchedFrequencyMetricStore();
  const item = newBatchedFrequencyMetric("code-66", "label-124");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
