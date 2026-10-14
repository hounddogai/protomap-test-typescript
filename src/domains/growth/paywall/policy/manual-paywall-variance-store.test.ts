import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPaywallVarianceStore } from "./manual-paywall-variance-store.js";
import { newManualPaywallVariance } from "./manual-paywall-variance.js";

test("MemoryManualPaywallVarianceStore finds what it saved", () => {
  const store = newMemoryManualPaywallVarianceStore();
  const item = newManualPaywallVariance("code-601", "label-285");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
