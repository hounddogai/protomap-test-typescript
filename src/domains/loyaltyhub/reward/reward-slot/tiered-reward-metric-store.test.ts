import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRewardMetricStore } from "./tiered-reward-metric-store.js";
import { newTieredRewardMetric } from "./tiered-reward-metric.js";

test("MemoryTieredRewardMetricStore finds what it saved", () => {
  const store = newMemoryTieredRewardMetricStore();
  const item = newTieredRewardMetric("code-382", "label-716");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
