import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBidRuleOverride } from "./fallback-bid-rule-override.js";

test("FallbackBidRuleOverride starts in open", () => {
  const item = newFallbackBidRuleOverride("code-829", "label-927");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBidRuleOverride moves to in review", () => {
  const item = newFallbackBidRuleOverride("code-829", "label-927");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackBidRuleOverride rejects moves from archived", () => {
  const item = newFallbackBidRuleOverride("code-829", "label-927");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
