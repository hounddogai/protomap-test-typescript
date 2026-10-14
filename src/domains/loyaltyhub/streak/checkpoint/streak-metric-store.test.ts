import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakMetricStore } from "./streak-metric-store.js";
import { newStreakMetric } from "./streak-metric.js";

test("MemoryStreakMetricStore finds what it saved", () => {
  const store = newMemoryStreakMetricStore();
  const item = newStreakMetric("code-801", "label-852");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
