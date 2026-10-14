import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictOptOutClaimStore } from "./strict-opt-out-claim-store.js";
import { newStrictOptOutClaim } from "./strict-opt-out-claim.js";

test("MemoryStrictOptOutClaimStore finds what it saved", () => {
  const store = newMemoryStrictOptOutClaimStore();
  const item = newStrictOptOutClaim("code-685", "name-509");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
