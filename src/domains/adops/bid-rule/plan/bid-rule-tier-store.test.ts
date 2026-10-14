import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleTierStore } from "./bid-rule-tier-store.js";
import { newBidRuleTier } from "./bid-rule-tier.js";

test("MemoryBidRuleTierStore finds what it saved", () => {
  const store = newMemoryBidRuleTierStore();
  const item = newBidRuleTier("code-33", "name-54");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
