import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardMetricStore } from "./reward-metric-store.js";
import { newRewardMetric } from "./reward-metric.js";

test("MemoryRewardMetricStore finds what it saved", () => {
  const store = newMemoryRewardMetricStore();
  const item = newRewardMetric("code-832", "title-935");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
