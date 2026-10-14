import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaMetricStore } from "./sla-metric-store.js";
import { newSlaMetric } from "./sla-metric.js";

test("MemorySlaMetricStore finds what it saved", () => {
  const store = newMemorySlaMetricStore();
  const item = newSlaMetric("code-210", "label-724");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
