import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitMetricStore } from "./wait-metric-store.js";
import { newWaitMetric } from "./wait-metric.js";

test("MemoryWaitMetricStore finds what it saved", () => {
  const store = newMemoryWaitMetricStore();
  const item = newWaitMetric("code-86", "name-114");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
