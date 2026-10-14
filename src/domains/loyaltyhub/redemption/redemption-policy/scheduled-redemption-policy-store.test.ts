import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledRedemptionPolicyStore } from "./scheduled-redemption-policy-store.js";
import { newScheduledRedemptionPolicy } from "./scheduled-redemption-policy.js";

test("MemoryScheduledRedemptionPolicyStore finds what it saved", () => {
  const store = newMemoryScheduledRedemptionPolicyStore();
  const item = newScheduledRedemptionPolicy("code-715", "title-653");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
