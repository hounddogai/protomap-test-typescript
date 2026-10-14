import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallThresholdStore } from "./paywall-threshold-store.js";
import { newPaywallThreshold } from "./paywall-threshold.js";

test("MemoryPaywallThresholdStore finds what it saved", () => {
  const store = newMemoryPaywallThresholdStore();
  const item = newPaywallThreshold("code-991", "label-809");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
