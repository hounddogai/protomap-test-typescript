import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedExitRuleMetricStore } from "./batched-exit-rule-metric-store.js";
import { newBatchedExitRuleMetric } from "./batched-exit-rule-metric.js";

test("MemoryBatchedExitRuleMetricStore finds what it saved", () => {
  const store = newMemoryBatchedExitRuleMetricStore();
  const item = newBatchedExitRuleMetric("code-96", "title-63");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
