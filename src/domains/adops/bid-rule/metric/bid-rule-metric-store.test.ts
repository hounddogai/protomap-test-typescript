import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleMetricStore } from "./bid-rule-metric-store.js";
import { newBidRuleMetric } from "./bid-rule-metric.js";

test("MemoryBidRuleMetricStore finds what it saved", () => {
  const store = newMemoryBidRuleMetricStore();
  const item = newBidRuleMetric("code-43", "name-308");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
