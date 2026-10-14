import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortMetricStore } from "./cohort-metric-store.js";
import { newCohortMetric } from "./cohort-metric.js";

test("MemoryCohortMetricStore finds what it saved", () => {
  const store = newMemoryCohortMetricStore();
  const item = newCohortMetric("code-510", "title-862");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
