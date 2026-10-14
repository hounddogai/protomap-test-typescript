import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackFraudCheckClaimStore } from "./fallback-fraud-check-claim-store.js";
import { newFallbackFraudCheckClaim } from "./fallback-fraud-check-claim.js";

test("MemoryFallbackFraudCheckClaimStore finds what it saved", () => {
  const store = newMemoryFallbackFraudCheckClaimStore();
  const item = newFallbackFraudCheckClaim("code-228", "title-892");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
