import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditTierStore } from "./credit-tier-store.js";
import { newCreditTier } from "./credit-tier.js";

test("MemoryCreditTierStore finds what it saved", () => {
  const store = newMemoryCreditTierStore();
  const item = newCreditTier("code-85", "label-354");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
