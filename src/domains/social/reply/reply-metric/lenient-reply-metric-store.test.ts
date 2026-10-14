import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientReplyMetricStore } from "./lenient-reply-metric-store.js";
import { newLenientReplyMetric } from "./lenient-reply-metric.js";

test("MemoryLenientReplyMetricStore finds what it saved", () => {
  const store = newMemoryLenientReplyMetricStore();
  const item = newLenientReplyMetric("code-630", "name-714");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
