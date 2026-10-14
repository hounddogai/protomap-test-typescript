import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictWaitMetricStore } from "./strict-wait-metric-store.js";
import { newStrictWaitMetric } from "./strict-wait-metric.js";

test("MemoryStrictWaitMetricStore finds what it saved", () => {
  const store = newMemoryStrictWaitMetricStore();
  const item = newStrictWaitMetric("code-795", "name-766");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
