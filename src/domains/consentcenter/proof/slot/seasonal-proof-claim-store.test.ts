import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalProofClaimStore } from "./seasonal-proof-claim-store.js";
import { newSeasonalProofClaim } from "./seasonal-proof-claim.js";

test("MemorySeasonalProofClaimStore finds what it saved", () => {
  const store = newMemorySeasonalProofClaimStore();
  const item = newSeasonalProofClaim("code-829", "title-819");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
