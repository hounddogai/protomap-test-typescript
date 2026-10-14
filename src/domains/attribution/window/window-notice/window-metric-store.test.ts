import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowMetricStore } from "./window-metric-store.js";
import { newWindowMetric } from "./window-metric.js";

test("MemoryWindowMetricStore finds what it saved", () => {
  const store = newMemoryWindowMetricStore();
  const item = newWindowMetric("code-862", "name-433");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
