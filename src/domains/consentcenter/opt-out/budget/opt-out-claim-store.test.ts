import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutClaimStore } from "./opt-out-claim-store.js";
import { newOptOutClaim } from "./opt-out-claim.js";

test("MemoryOptOutClaimStore finds what it saved", () => {
  const store = newMemoryOptOutClaimStore();
  const item = newOptOutClaim("code-558", "name-183");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
