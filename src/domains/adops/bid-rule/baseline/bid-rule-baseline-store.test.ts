import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleBaselineStore } from "./bid-rule-baseline-store.js";
import { newBidRuleBaseline } from "./bid-rule-baseline.js";

test("MemoryBidRuleBaselineStore finds what it saved", () => {
  const store = newMemoryBidRuleBaselineStore();
  const item = newBidRuleBaseline("code-302", "name-896");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
