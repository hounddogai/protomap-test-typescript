import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingRedemptionPolicyStore } from "./pending-redemption-policy-store.js";
import { newPendingRedemptionPolicy } from "./pending-redemption-policy.js";

test("MemoryPendingRedemptionPolicyStore finds what it saved", () => {
  const store = newMemoryPendingRedemptionPolicyStore();
  const item = newPendingRedemptionPolicy("code-187", "title-904");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
