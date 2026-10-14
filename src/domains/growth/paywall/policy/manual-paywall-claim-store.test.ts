import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPaywallClaimStore } from "./manual-paywall-claim-store.js";
import { newManualPaywallClaim } from "./manual-paywall-claim.js";

test("MemoryManualPaywallClaimStore finds what it saved", () => {
  const store = newMemoryManualPaywallClaimStore();
  const item = newManualPaywallClaim("code-594", "label-746");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
