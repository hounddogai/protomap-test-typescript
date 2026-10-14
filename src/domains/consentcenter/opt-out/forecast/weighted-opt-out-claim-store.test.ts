import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedOptOutClaimStore } from "./weighted-opt-out-claim-store.js";
import { newWeightedOptOutClaim } from "./weighted-opt-out-claim.js";

test("MemoryWeightedOptOutClaimStore finds what it saved", () => {
  const store = newMemoryWeightedOptOutClaimStore();
  const item = newWeightedOptOutClaim("code-397", "name-609");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
