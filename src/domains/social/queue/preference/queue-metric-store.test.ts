import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueMetricStore } from "./queue-metric-store.js";
import { newQueueMetric } from "./queue-metric.js";

test("MemoryQueueMetricStore finds what it saved", () => {
  const store = newMemoryQueueMetricStore();
  const item = newQueueMetric("code-713", "name-312");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
