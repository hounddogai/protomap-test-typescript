import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFlightMetricStore } from "./fallback-flight-metric-store.js";
import { newFallbackFlightMetric } from "./fallback-flight-metric.js";

test("MemoryFallbackFlightMetricStore finds what it saved", () => {
  const store = newMemoryFallbackFlightMetricStore();
  const item = newFallbackFlightMetric("code-286", "label-296");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
