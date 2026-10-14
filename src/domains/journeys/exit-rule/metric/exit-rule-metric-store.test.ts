import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleMetricStore } from "./exit-rule-metric-store.js";
import { newExitRuleMetric } from "./exit-rule-metric.js";

test("MemoryExitRuleMetricStore finds what it saved", () => {
  const store = newMemoryExitRuleMetricStore();
  const item = newExitRuleMetric("code-739", "label-312");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
