import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyBranchTierStore } from "./legacy-branch-tier-store.js";
import { newLegacyBranchTier } from "./legacy-branch-tier.js";

test("MemoryLegacyBranchTierStore finds what it saved", () => {
  const store = newMemoryLegacyBranchTierStore();
  const item = newLegacyBranchTier("code-46", "title-495");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
