import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchClaimStore } from "./branch-claim-store.js";
import { newBranchClaim } from "./branch-claim.js";

test("MemoryBranchClaimStore finds what it saved", () => {
  const store = newMemoryBranchClaimStore();
  const item = newBranchClaim("code-380", "name-928");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
