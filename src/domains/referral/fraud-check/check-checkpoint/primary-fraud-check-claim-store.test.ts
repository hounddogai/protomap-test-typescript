import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFraudCheckClaimStore } from "./primary-fraud-check-claim-store.js";
import { newPrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

test("MemoryPrimaryFraudCheckClaimStore finds what it saved", () => {
  const store = newMemoryPrimaryFraudCheckClaimStore();
  const item = newPrimaryFraudCheckClaim("code-624", "label-100");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
