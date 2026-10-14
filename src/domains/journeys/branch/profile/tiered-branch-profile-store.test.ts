import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBranchProfileStore } from "./tiered-branch-profile-store.js";
import { newTieredBranchProfile } from "./tiered-branch-profile.js";

test("MemoryTieredBranchProfileStore finds what it saved", () => {
  const store = newMemoryTieredBranchProfileStore();
  const item = newTieredBranchProfile("code-971", "name-958");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
