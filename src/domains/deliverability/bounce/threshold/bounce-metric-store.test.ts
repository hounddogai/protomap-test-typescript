import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceMetricStore } from "./bounce-metric-store.js";
import { newBounceMetric } from "./bounce-metric.js";

test("MemoryBounceMetricStore finds what it saved", () => {
  const store = newMemoryBounceMetricStore();
  const item = newBounceMetric("code-229", "title-884");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
