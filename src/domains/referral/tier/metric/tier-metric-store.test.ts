import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTierMetricStore } from "./tier-metric-store.js";
import { newTierMetric } from "./tier-metric.js";

test("MemoryTierMetricStore finds what it saved", () => {
  const store = newMemoryTierMetricStore();
  const item = newTierMetric("code-892", "label-40");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
