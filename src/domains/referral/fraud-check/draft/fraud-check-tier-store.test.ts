import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckTierStore } from "./fraud-check-tier-store.js";
import { newFraudCheckTier } from "./fraud-check-tier.js";

test("MemoryFraudCheckTierStore finds what it saved", () => {
  const store = newMemoryFraudCheckTierStore();
  const item = newFraudCheckTier("code-710", "label-425");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
