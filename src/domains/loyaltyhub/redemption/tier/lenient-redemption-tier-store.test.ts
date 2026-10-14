import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRedemptionTierStore } from "./lenient-redemption-tier-store.js";
import { newLenientRedemptionTier } from "./lenient-redemption-tier.js";

test("MemoryLenientRedemptionTierStore finds what it saved", () => {
  const store = newMemoryLenientRedemptionTierStore();
  const item = newLenientRedemptionTier("code-490", "name-634");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
