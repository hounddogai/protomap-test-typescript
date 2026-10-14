import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryReplyMetricStore } from "./primary-reply-metric-store.js";
import { newPrimaryReplyMetric } from "./primary-reply-metric.js";

test("MemoryPrimaryReplyMetricStore finds what it saved", () => {
  const store = newMemoryPrimaryReplyMetricStore();
  const item = newPrimaryReplyMetric("code-425", "label-928");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
