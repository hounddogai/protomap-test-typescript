import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBidRuleTierStore } from "./manual-bid-rule-tier-store.js";
import { newManualBidRuleTier } from "./manual-bid-rule-tier.js";

test("MemoryManualBidRuleTierStore finds what it saved", () => {
  const store = newMemoryManualBidRuleTierStore();
  const item = newManualBidRuleTier("code-375", "name-527");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
