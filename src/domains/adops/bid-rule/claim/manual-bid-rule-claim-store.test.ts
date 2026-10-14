import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBidRuleClaimStore } from "./manual-bid-rule-claim-store.js";
import { newManualBidRuleClaim } from "./manual-bid-rule-claim.js";

test("MemoryManualBidRuleClaimStore finds what it saved", () => {
  const store = newMemoryManualBidRuleClaimStore();
  const item = newManualBidRuleClaim("code-755", "label-906");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
