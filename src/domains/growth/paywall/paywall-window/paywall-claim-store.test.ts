import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallClaimStore } from "./paywall-claim-store.js";
import { newPaywallClaim } from "./paywall-claim.js";

test("MemoryPaywallClaimStore finds what it saved", () => {
  const store = newMemoryPaywallClaimStore();
  const item = newPaywallClaim("code-540", "title-618");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
