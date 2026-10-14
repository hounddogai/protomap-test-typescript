import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyProofClaimStore } from "./legacy-proof-claim-store.js";
import { newLegacyProofClaim } from "./legacy-proof-claim.js";

test("MemoryLegacyProofClaimStore finds what it saved", () => {
  const store = newMemoryLegacyProofClaimStore();
  const item = newLegacyProofClaim("code-76", "name-188");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
