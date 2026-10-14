import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedCsatMetricStore } from "./capped-csat-metric-store.js";
import { newCappedCsatMetric } from "./capped-csat-metric.js";

test("MemoryCappedCsatMetricStore finds what it saved", () => {
  const store = newMemoryCappedCsatMetricStore();
  const item = newCappedCsatMetric("code-150", "name-426");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
