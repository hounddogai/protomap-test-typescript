import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryTierMetricStore } from "./primary-tier-metric-store.js";
import { newPrimaryTierMetric } from "./primary-tier-metric.js";

test("MemoryPrimaryTierMetricStore finds what it saved", () => {
  const store = newMemoryPrimaryTierMetricStore();
  const item = newPrimaryTierMetric("code-361", "name-973");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
