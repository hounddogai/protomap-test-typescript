import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedRewardRuleNotice } from "./capped-reward-rule-notice.js";

test("CappedRewardRuleNotice starts in open", () => {
  const item = newCappedRewardRuleNotice("code-852", "label-25");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedRewardRuleNotice moves to in review", () => {
  const item = newCappedRewardRuleNotice("code-852", "label-25");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("CappedRewardRuleNotice rejects moves from archived", () => {
  const item = newCappedRewardRuleNotice("code-852", "label-25");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
