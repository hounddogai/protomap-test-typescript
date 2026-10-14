import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredStepTierStore } from "./tiered-step-tier-store.js";
import { newTieredStepTier } from "./tiered-step-tier.js";

test("MemoryTieredStepTierStore finds what it saved", () => {
  const store = newMemoryTieredStepTierStore();
  const item = newTieredStepTier("code-724", "name-891");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
