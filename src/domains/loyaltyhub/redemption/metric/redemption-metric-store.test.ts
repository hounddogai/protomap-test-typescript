import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionMetricStore } from "./redemption-metric-store.js";
import { newRedemptionMetric } from "./redemption-metric.js";

test("MemoryRedemptionMetricStore finds what it saved", () => {
  const store = newMemoryRedemptionMetricStore();
  const item = newRedemptionMetric("code-787", "label-744");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
