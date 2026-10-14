import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackRewardRuleMetric } from "./fallback-reward-rule-metric.js";

test("FallbackRewardRuleMetric starts in open", () => {
  const item = newFallbackRewardRuleMetric("code-2", "name-592");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackRewardRuleMetric moves to resolved", () => {
  const item = newFallbackRewardRuleMetric("code-2", "name-592");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("FallbackRewardRuleMetric rejects moves from archived", () => {
  const item = newFallbackRewardRuleMetric("code-2", "name-592");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
