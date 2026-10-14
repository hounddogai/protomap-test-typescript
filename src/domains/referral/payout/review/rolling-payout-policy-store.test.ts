import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPayoutPolicyStore } from "./rolling-payout-policy-store.js";
import { newRollingPayoutPolicy } from "./rolling-payout-policy.js";

test("MemoryRollingPayoutPolicyStore finds what it saved", () => {
  const store = newMemoryRollingPayoutPolicyStore();
  const item = newRollingPayoutPolicy("code-551", "title-980");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
