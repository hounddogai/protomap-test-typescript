import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPayoutPolicyStore } from "./weighted-payout-policy-store.js";
import { newWeightedPayoutPolicy } from "./weighted-payout-policy.js";

test("MemoryWeightedPayoutPolicyStore finds what it saved", () => {
  const store = newMemoryWeightedPayoutPolicyStore();
  const item = newWeightedPayoutPolicy("code-591", "title-615");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
