import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingInsightMetricStore } from "./pending-insight-metric-store.js";
import { newPendingInsightMetric } from "./pending-insight-metric.js";

test("MemoryPendingInsightMetricStore finds what it saved", () => {
  const store = newMemoryPendingInsightMetricStore();
  const item = newPendingInsightMetric("code-795", "name-196");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
