import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyMetricStore } from "./frequency-metric-store.js";
import { newFrequencyMetric } from "./frequency-metric.js";

test("MemoryFrequencyMetricStore finds what it saved", () => {
  const store = newMemoryFrequencyMetricStore();
  const item = newFrequencyMetric("code-35", "name-977");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
