import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPaywallPolicyStore } from "./seasonal-paywall-policy-store.js";
import { newSeasonalPaywallPolicy } from "./seasonal-paywall-policy.js";

test("MemorySeasonalPaywallPolicyStore finds what it saved", () => {
  const store = newMemorySeasonalPaywallPolicyStore();
  const item = newSeasonalPaywallPolicy("code-162", "label-542");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
