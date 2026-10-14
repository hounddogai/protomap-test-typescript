import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditClaimStore } from "./credit-claim-store.js";
import { newCreditClaim } from "./credit-claim.js";

test("MemoryCreditClaimStore finds what it saved", () => {
  const store = newMemoryCreditClaimStore();
  const item = newCreditClaim("code-441", "name-366");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
