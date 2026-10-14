import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveComplaintMetricStore } from "./adaptive-complaint-metric-store.js";
import { newAdaptiveComplaintMetric } from "./adaptive-complaint-metric.js";

test("MemoryAdaptiveComplaintMetricStore finds what it saved", () => {
  const store = newMemoryAdaptiveComplaintMetricStore();
  const item = newAdaptiveComplaintMetric("code-261", "name-847");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
