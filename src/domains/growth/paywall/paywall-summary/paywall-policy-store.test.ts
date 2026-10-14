import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallPolicyStore } from "./paywall-policy-store.js";
import { newPaywallPolicy } from "./paywall-policy.js";

test("MemoryPaywallPolicyStore finds what it saved", () => {
  const store = newMemoryPaywallPolicyStore();
  const item = newPaywallPolicy("code-804", "name-518");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
