import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPaywallMetricStore } from "./legacy-paywall-metric-store.js";
import { newLegacyPaywallMetric } from "./legacy-paywall-metric.js";

test("MemoryLegacyPaywallMetricStore finds what it saved", () => {
  const store = newMemoryLegacyPaywallMetricStore();
  const item = newLegacyPaywallMetric("code-110", "title-392");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
