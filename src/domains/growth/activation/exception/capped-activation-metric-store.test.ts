import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedActivationMetricStore } from "./capped-activation-metric-store.js";
import { newCappedActivationMetric } from "./capped-activation-metric.js";

test("MemoryCappedActivationMetricStore finds what it saved", () => {
  const store = newMemoryCappedActivationMetricStore();
  const item = newCappedActivationMetric("code-22", "name-191");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
