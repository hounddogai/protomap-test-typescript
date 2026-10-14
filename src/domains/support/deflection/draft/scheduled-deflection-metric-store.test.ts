import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDeflectionMetricStore } from "./scheduled-deflection-metric-store.js";
import { newScheduledDeflectionMetric } from "./scheduled-deflection-metric.js";

test("MemoryScheduledDeflectionMetricStore finds what it saved", () => {
  const store = newMemoryScheduledDeflectionMetricStore();
  const item = newScheduledDeflectionMetric("code-601", "label-863");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
