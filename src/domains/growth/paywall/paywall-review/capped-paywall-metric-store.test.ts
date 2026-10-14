import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPaywallMetricStore } from "./capped-paywall-metric-store.js";
import { newCappedPaywallMetric } from "./capped-paywall-metric.js";

test("MemoryCappedPaywallMetricStore finds what it saved", () => {
  const store = newMemoryCappedPaywallMetricStore();
  const item = newCappedPaywallMetric("code-825", "title-434");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
