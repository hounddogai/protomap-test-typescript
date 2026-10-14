import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryOptOutClaimStore } from "./primary-opt-out-claim-store.js";
import { newPrimaryOptOutClaim } from "./primary-opt-out-claim.js";

test("MemoryPrimaryOptOutClaimStore finds what it saved", () => {
  const store = newMemoryPrimaryOptOutClaimStore();
  const item = newPrimaryOptOutClaim("code-184", "label-452");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
