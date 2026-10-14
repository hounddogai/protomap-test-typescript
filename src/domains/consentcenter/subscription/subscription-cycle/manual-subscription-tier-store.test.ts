import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualSubscriptionTierStore } from "./manual-subscription-tier-store.js";
import { newManualSubscriptionTier } from "./manual-subscription-tier.js";

test("MemoryManualSubscriptionTierStore finds what it saved", () => {
  const store = newMemoryManualSubscriptionTierStore();
  const item = newManualSubscriptionTier("code-294", "label-202");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
