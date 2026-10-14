import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedNudgeMetricStore } from "./weighted-nudge-metric-store.js";
import { newWeightedNudgeMetric } from "./weighted-nudge-metric.js";

test("MemoryWeightedNudgeMetricStore finds what it saved", () => {
  const store = newMemoryWeightedNudgeMetricStore();
  const item = newWeightedNudgeMetric("code-368", "name-629");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
