import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultRewardRuleWindow } from "./default-reward-rule-window.js";

test("DefaultRewardRuleWindow starts in open", () => {
  const item = newDefaultRewardRuleWindow("code-305", "title-248");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultRewardRuleWindow moves to archived", () => {
  const item = newDefaultRewardRuleWindow("code-305", "title-248");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("DefaultRewardRuleWindow rejects moves from archived", () => {
  const item = newDefaultRewardRuleWindow("code-305", "title-248");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
