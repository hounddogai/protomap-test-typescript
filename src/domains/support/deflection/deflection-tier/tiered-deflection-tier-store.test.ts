import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredDeflectionTierStore } from "./tiered-deflection-tier-store.js";
import { newTieredDeflectionTier } from "./tiered-deflection-tier.js";

test("MemoryTieredDeflectionTierStore finds what it saved", () => {
  const store = newMemoryTieredDeflectionTierStore();
  const item = newTieredDeflectionTier("code-477", "label-93");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
