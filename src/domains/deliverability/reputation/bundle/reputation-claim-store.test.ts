import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationClaimStore } from "./reputation-claim-store.js";
import { newReputationClaim } from "./reputation-claim.js";

test("MemoryReputationClaimStore finds what it saved", () => {
  const store = newMemoryReputationClaimStore();
  const item = newReputationClaim("code-368", "label-986");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
