import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFraudCheckClaimStore } from "./legacy-fraud-check-claim-store.js";
import { newLegacyFraudCheckClaim } from "./legacy-fraud-check-claim.js";

test("MemoryLegacyFraudCheckClaimStore finds what it saved", () => {
  const store = newMemoryLegacyFraudCheckClaimStore();
  const item = newLegacyFraudCheckClaim("code-568", "label-711");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
