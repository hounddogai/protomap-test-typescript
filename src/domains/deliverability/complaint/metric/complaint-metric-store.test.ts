import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintMetricStore } from "./complaint-metric-store.js";
import { newComplaintMetric } from "./complaint-metric.js";

test("MemoryComplaintMetricStore finds what it saved", () => {
  const store = newMemoryComplaintMetricStore();
  const item = newComplaintMetric("code-573", "name-746");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
