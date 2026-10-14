import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientFlightMetricStore } from "./lenient-flight-metric-store.js";
import { newLenientFlightMetric } from "./lenient-flight-metric.js";

test("MemoryLenientFlightMetricStore finds what it saved", () => {
  const store = newMemoryLenientFlightMetricStore();
  const item = newLenientFlightMetric("code-118", "label-734");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
