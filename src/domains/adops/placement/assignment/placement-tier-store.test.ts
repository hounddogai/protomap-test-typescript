import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementTierStore } from "./placement-tier-store.js";
import { newPlacementTier } from "./placement-tier.js";

test("MemoryPlacementTierStore finds what it saved", () => {
  const store = newMemoryPlacementTierStore();
  const item = newPlacementTier("code-266", "name-922");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
