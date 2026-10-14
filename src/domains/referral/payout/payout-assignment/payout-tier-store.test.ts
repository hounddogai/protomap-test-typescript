import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPayoutTierStore } from "./payout-tier-store.js";
import { newPayoutTier } from "./payout-tier.js";

test("MemoryPayoutTierStore finds what it saved", () => {
  const store = newMemoryPayoutTierStore();
  const item = newPayoutTier("code-26", "label-221");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
