import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWindowMetricStore } from "./lenient-window-metric-store.js";
import { newLenientWindowMetric } from "./lenient-window-metric.js";

test("MemoryLenientWindowMetricStore finds what it saved", () => {
  const store = newMemoryLenientWindowMetricStore();
  const item = newLenientWindowMetric("code-892", "label-425");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
