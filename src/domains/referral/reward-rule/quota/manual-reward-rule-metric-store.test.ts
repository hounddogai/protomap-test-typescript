import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualRewardRuleMetricStore } from "./manual-reward-rule-metric-store.js";
import { newManualRewardRuleMetric } from "./manual-reward-rule-metric.js";

test("MemoryManualRewardRuleMetricStore finds what it saved", () => {
  const store = newMemoryManualRewardRuleMetricStore();
  const item = newManualRewardRuleMetric("code-58", "label-841");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
