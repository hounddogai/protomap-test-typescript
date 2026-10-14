import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSenderMetricStore } from "./fallback-sender-metric-store.js";
import { newFallbackSenderMetric } from "./fallback-sender-metric.js";

test("MemoryFallbackSenderMetricStore finds what it saved", () => {
  const store = newMemoryFallbackSenderMetricStore();
  const item = newFallbackSenderMetric("code-943", "label-375");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
