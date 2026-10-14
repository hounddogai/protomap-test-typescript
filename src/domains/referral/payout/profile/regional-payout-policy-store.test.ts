import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPayoutPolicyStore } from "./regional-payout-policy-store.js";
import { newRegionalPayoutPolicy } from "./regional-payout-policy.js";

test("MemoryRegionalPayoutPolicyStore finds what it saved", () => {
  const store = newMemoryRegionalPayoutPolicyStore();
  const item = newRegionalPayoutPolicy("code-37", "title-113");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
