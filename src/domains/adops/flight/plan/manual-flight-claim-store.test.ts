import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFlightClaimStore } from "./manual-flight-claim-store.js";
import { newManualFlightClaim } from "./manual-flight-claim.js";

test("MemoryManualFlightClaimStore finds what it saved", () => {
  const store = newMemoryManualFlightClaimStore();
  const item = newManualFlightClaim("code-155", "name-904");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
