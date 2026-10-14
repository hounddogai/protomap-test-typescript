import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionMetricStore } from "./retention-metric-store.js";
import { newRetentionMetric } from "./retention-metric.js";

test("MemoryRetentionMetricStore finds what it saved", () => {
  const store = newMemoryRetentionMetricStore();
  const item = newRetentionMetric("code-852", "name-127");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
