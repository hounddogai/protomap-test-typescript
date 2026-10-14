import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleWindow } from "./bid-rule-window.js";

test("BidRuleWindow starts in open", () => {
  const item = newBidRuleWindow("code-23", "label-631");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleWindow moves to in review", () => {
  const item = newBidRuleWindow("code-23", "label-631");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("BidRuleWindow rejects moves from archived", () => {
  const item = newBidRuleWindow("code-23", "label-631");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
