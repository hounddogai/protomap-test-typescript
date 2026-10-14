import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultRewardRuleBatch } from "./default-reward-rule-batch.js";

test("DefaultRewardRuleBatch starts in proposed", () => {
  const item = newDefaultRewardRuleBatch("code-3", "name-826");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultRewardRuleBatch moves to approved", () => {
  const item = newDefaultRewardRuleBatch("code-3", "name-826");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultRewardRuleBatch rejects moves from withdrawn", () => {
  const item = newDefaultRewardRuleBatch("code-3", "name-826");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
