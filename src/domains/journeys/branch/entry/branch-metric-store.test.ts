import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchMetricStore } from "./branch-metric-store.js";
import { newBranchMetric } from "./branch-metric.js";

test("MemoryBranchMetricStore finds what it saved", () => {
  const store = newMemoryBranchMetricStore();
  const item = newBranchMetric("code-682", "name-455");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
