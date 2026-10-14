import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalFlightClaimStore } from "./global-flight-claim-store.js";
import { newGlobalFlightClaim } from "./global-flight-claim.js";

test("MemoryGlobalFlightClaimStore finds what it saved", () => {
  const store = newMemoryGlobalFlightClaimStore();
  const item = newGlobalFlightClaim("code-534", "name-588");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
