import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedBranchProfileStore } from "./weighted-branch-profile-store.js";
import { newWeightedBranchProfile } from "./weighted-branch-profile.js";

test("MemoryWeightedBranchProfileStore finds what it saved", () => {
  const store = newMemoryWeightedBranchProfileStore();
  const item = newWeightedBranchProfile("code-958", "title-655");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
