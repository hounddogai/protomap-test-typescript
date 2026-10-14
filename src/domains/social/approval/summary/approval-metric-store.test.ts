import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalMetricStore } from "./approval-metric-store.js";
import { newApprovalMetric } from "./approval-metric.js";

test("MemoryApprovalMetricStore finds what it saved", () => {
  const store = newMemoryApprovalMetricStore();
  const item = newApprovalMetric("code-992", "label-844");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
