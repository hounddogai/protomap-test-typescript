import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalPathMetricStore } from "./global-path-metric-store.js";
import { newGlobalPathMetric } from "./global-path-metric.js";

test("MemoryGlobalPathMetricStore finds what it saved", () => {
  const store = newMemoryGlobalPathMetricStore();
  const item = newGlobalPathMetric("code-410", "name-68");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
