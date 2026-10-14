import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualComplaintMetricStore } from "./manual-complaint-metric-store.js";
import { newManualComplaintMetric } from "./manual-complaint-metric.js";

test("MemoryManualComplaintMetricStore finds what it saved", () => {
  const store = newMemoryManualComplaintMetricStore();
  const item = newManualComplaintMetric("code-721", "title-515");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
