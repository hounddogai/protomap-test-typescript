import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientBranchMetricStore } from "./lenient-branch-metric-store.js";
import { newLenientBranchMetric } from "./lenient-branch-metric.js";

test("MemoryLenientBranchMetricStore finds what it saved", () => {
  const store = newMemoryLenientBranchMetricStore();
  const item = newLenientBranchMetric("code-243", "title-721");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
