import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalExitRuleMetricStore } from "./seasonal-exit-rule-metric-store.js";
import { newSeasonalExitRuleMetric } from "./seasonal-exit-rule-metric.js";

test("MemorySeasonalExitRuleMetricStore finds what it saved", () => {
  const store = newMemorySeasonalExitRuleMetricStore();
  const item = newSeasonalExitRuleMetric("code-237", "label-304");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
