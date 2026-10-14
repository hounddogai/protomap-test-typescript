import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPaywallThresholdStore } from "./legacy-paywall-threshold-store.js";
import { newLegacyPaywallThreshold } from "./legacy-paywall-threshold.js";

test("MemoryLegacyPaywallThresholdStore finds what it saved", () => {
  const store = newMemoryLegacyPaywallThresholdStore();
  const item = newLegacyPaywallThreshold("code-360", "name-211");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
