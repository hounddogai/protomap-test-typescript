import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyMetricStore } from "./reply-metric-store.js";
import { newReplyMetric } from "./reply-metric.js";

test("MemoryReplyMetricStore finds what it saved", () => {
  const store = newMemoryReplyMetricStore();
  const item = newReplyMetric("code-848", "label-321");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
