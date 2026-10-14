import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathMetricStore } from "./path-metric-store.js";
import { newPathMetric } from "./path-metric.js";

test("MemoryPathMetricStore finds what it saved", () => {
  const store = newMemoryPathMetricStore();
  const item = newPathMetric("code-340", "name-513");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
