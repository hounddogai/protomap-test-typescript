import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBidRulePreference } from "./fallback-bid-rule-preference.js";

test("FallbackBidRulePreference starts in proposed", () => {
  const item = newFallbackBidRulePreference("code-93", "name-687");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBidRulePreference moves to rejected", () => {
  const item = newFallbackBidRulePreference("code-93", "name-687");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("FallbackBidRulePreference rejects moves from withdrawn", () => {
  const item = newFallbackBidRulePreference("code-93", "name-687");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
