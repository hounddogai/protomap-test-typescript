import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackRewardRuleMetricStore } from "./fallback-reward-rule-metric-store.js";
import { newFallbackRewardRuleMetric } from "./fallback-reward-rule-metric.js";

test("MemoryFallbackRewardRuleMetricStore finds what it saved", () => {
  const store = newMemoryFallbackRewardRuleMetricStore();
  const item = newFallbackRewardRuleMetric("code-2", "name-592");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
