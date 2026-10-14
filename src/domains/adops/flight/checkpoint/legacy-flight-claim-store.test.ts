import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFlightClaimStore } from "./legacy-flight-claim-store.js";
import { newLegacyFlightClaim } from "./legacy-flight-claim.js";

test("MemoryLegacyFlightClaimStore finds what it saved", () => {
  const store = newMemoryLegacyFlightClaimStore();
  const item = newLegacyFlightClaim("code-474", "title-399");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
