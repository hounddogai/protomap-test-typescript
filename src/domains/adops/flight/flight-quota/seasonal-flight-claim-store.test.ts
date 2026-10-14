import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalFlightClaimStore } from "./seasonal-flight-claim-store.js";
import { newSeasonalFlightClaim } from "./seasonal-flight-claim.js";

test("MemorySeasonalFlightClaimStore finds what it saved", () => {
  const store = newMemorySeasonalFlightClaimStore();
  const item = newSeasonalFlightClaim("code-72", "title-192");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
