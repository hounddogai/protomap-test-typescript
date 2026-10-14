import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionPolicyStore } from "./subscription-policy-store.js";
import { newSubscriptionPolicy } from "./subscription-policy.js";

test("MemorySubscriptionPolicyStore finds what it saved", () => {
  const store = newMemorySubscriptionPolicyStore();
  const item = newSubscriptionPolicy("code-259", "label-263");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
