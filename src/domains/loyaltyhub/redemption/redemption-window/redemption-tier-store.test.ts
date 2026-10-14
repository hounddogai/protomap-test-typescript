import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionTierStore } from "./redemption-tier-store.js";
import { newRedemptionTier } from "./redemption-tier.js";

test("MemoryRedemptionTierStore finds what it saved", () => {
  const store = newMemoryRedemptionTierStore();
  const item = newRedemptionTier("code-988", "label-237");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
