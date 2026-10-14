import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedRewardRuleBatch } from "./capped-reward-rule-batch.js";

test("CappedRewardRuleBatch starts in new", () => {
  const item = newCappedRewardRuleBatch("code-274", "title-527");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedRewardRuleBatch moves to queued", () => {
  const item = newCappedRewardRuleBatch("code-274", "title-527");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("CappedRewardRuleBatch rejects moves from failed", () => {
  const item = newCappedRewardRuleBatch("code-274", "title-527");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
