import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionPolicyStore } from "./redemption-policy-store.js";
import { newRedemptionPolicy } from "./redemption-policy.js";

test("MemoryRedemptionPolicyStore finds what it saved", () => {
  const store = newMemoryRedemptionPolicyStore();
  const item = newRedemptionPolicy("code-450", "label-289");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
