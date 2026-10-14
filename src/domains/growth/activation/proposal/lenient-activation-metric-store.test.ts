import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientActivationMetricStore } from "./lenient-activation-metric-store.js";
import { newLenientActivationMetric } from "./lenient-activation-metric.js";

test("MemoryLenientActivationMetricStore finds what it saved", () => {
  const store = newMemoryLenientActivationMetricStore();
  const item = newLenientActivationMetric("code-437", "name-827");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
