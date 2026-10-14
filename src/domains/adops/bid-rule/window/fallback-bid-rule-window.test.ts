import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackBidRuleWindow } from "./fallback-bid-rule-window.js";

test("FallbackBidRuleWindow starts in open", () => {
  const item = newFallbackBidRuleWindow("code-317", "label-866");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackBidRuleWindow moves to in review", () => {
  const item = newFallbackBidRuleWindow("code-317", "label-866");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("FallbackBidRuleWindow rejects moves from archived", () => {
  const item = newFallbackBidRuleWindow("code-317", "label-866");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
