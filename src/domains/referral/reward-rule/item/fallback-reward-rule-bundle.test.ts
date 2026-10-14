import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackRewardRuleBundle } from "./fallback-reward-rule-bundle.js";

test("FallbackRewardRuleBundle starts in idle", () => {
  const item = newFallbackRewardRuleBundle("code-274", "title-239");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackRewardRuleBundle moves to warming", () => {
  const item = newFallbackRewardRuleBundle("code-274", "title-239");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("FallbackRewardRuleBundle rejects moves from stopped", () => {
  const item = newFallbackRewardRuleBundle("code-274", "title-239");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
