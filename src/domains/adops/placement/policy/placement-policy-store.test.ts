import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPlacementPolicyStore } from "./placement-policy-store.js";
import { newPlacementPolicy } from "./placement-policy.js";

test("MemoryPlacementPolicyStore finds what it saved", () => {
  const store = newMemoryPlacementPolicyStore();
  const item = newPlacementPolicy("code-754", "title-980");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
