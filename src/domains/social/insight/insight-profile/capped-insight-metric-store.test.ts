import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedInsightMetricStore } from "./capped-insight-metric-store.js";
import { newCappedInsightMetric } from "./capped-insight-metric.js";

test("MemoryCappedInsightMetricStore finds what it saved", () => {
  const store = newMemoryCappedInsightMetricStore();
  const item = newCappedInsightMetric("code-187", "label-856");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
