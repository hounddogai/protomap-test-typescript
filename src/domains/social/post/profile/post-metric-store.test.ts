import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostMetricStore } from "./post-metric-store.js";
import { newPostMetric } from "./post-metric.js";

test("MemoryPostMetricStore finds what it saved", () => {
  const store = newMemoryPostMetricStore();
  const item = newPostMetric("code-65", "label-682");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
