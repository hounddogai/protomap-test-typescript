import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingFlightMetricStore } from "./rolling-flight-metric-store.js";
import { newRollingFlightMetric } from "./rolling-flight-metric.js";

test("MemoryRollingFlightMetricStore finds what it saved", () => {
  const store = newMemoryRollingFlightMetricStore();
  const item = newRollingFlightMetric("code-12", "label-381");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
