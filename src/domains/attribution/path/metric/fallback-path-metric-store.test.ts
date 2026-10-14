import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackPathMetricStore } from "./fallback-path-metric-store.js";
import { newFallbackPathMetric } from "./fallback-path-metric.js";

test("MemoryFallbackPathMetricStore finds what it saved", () => {
  const store = newMemoryFallbackPathMetricStore();
  const item = newFallbackPathMetric("code-443", "label-453");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
