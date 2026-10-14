import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatMetricStore } from "./csat-metric-store.js";
import { newCsatMetric } from "./csat-metric.js";

test("MemoryCsatMetricStore finds what it saved", () => {
  const store = newMemoryCsatMetricStore();
  const item = newCsatMetric("code-674", "name-853");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
