import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredExitRuleMetricStore } from "./tiered-exit-rule-metric-store.js";
import { newTieredExitRuleMetric } from "./tiered-exit-rule-metric.js";

test("MemoryTieredExitRuleMetricStore finds what it saved", () => {
  const store = newMemoryTieredExitRuleMetricStore();
  const item = newTieredExitRuleMetric("code-896", "title-379");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
