import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightClaimStore } from "./flight-claim-store.js";
import { newFlightClaim } from "./flight-claim.js";

test("MemoryFlightClaimStore finds what it saved", () => {
  const store = newMemoryFlightClaimStore();
  const item = newFlightClaim("code-901", "title-442");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
