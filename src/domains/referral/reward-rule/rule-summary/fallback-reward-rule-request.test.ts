import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackRewardRuleRequest } from "./fallback-reward-rule-request.js";

test("FallbackRewardRuleRequest starts in draft", () => {
  const item = newFallbackRewardRuleRequest("code-40", "label-887");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackRewardRuleRequest moves to pending", () => {
  const item = newFallbackRewardRuleRequest("code-40", "label-887");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("FallbackRewardRuleRequest rejects moves from closed", () => {
  const item = newFallbackRewardRuleRequest("code-40", "label-887");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
