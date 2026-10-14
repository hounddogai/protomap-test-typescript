import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalSubscriptionTierStore } from "./seasonal-subscription-tier-store.js";
import { newSeasonalSubscriptionTier } from "./seasonal-subscription-tier.js";

test("MemorySeasonalSubscriptionTierStore finds what it saved", () => {
  const store = newMemorySeasonalSubscriptionTierStore();
  const item = newSeasonalSubscriptionTier("code-759", "title-437");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
