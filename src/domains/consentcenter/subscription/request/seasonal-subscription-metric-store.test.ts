import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalSubscriptionMetricStore } from "./seasonal-subscription-metric-store.js";
import { newSeasonalSubscriptionMetric } from "./seasonal-subscription-metric.js";

test("MemorySeasonalSubscriptionMetricStore finds what it saved", () => {
  const store = newMemorySeasonalSubscriptionMetricStore();
  const item = newSeasonalSubscriptionMetric("code-704", "name-206");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
