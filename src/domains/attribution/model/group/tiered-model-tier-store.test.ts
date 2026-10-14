import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredModelTierStore } from "./tiered-model-tier-store.js";
import { newTieredModelTier } from "./tiered-model-tier.js";

test("MemoryTieredModelTierStore finds what it saved", () => {
  const store = newMemoryTieredModelTierStore();
  const item = newTieredModelTier("code-53", "name-235");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
