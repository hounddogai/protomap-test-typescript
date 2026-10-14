import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveRewardRuleSummary } from "./adaptive-reward-rule-summary.js";

test("AdaptiveRewardRuleSummary starts in created", () => {
  const item = newAdaptiveRewardRuleSummary("code-786", "name-60");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveRewardRuleSummary moves to validated", () => {
  const item = newAdaptiveRewardRuleSummary("code-786", "name-60");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("AdaptiveRewardRuleSummary rejects moves from retired", () => {
  const item = newAdaptiveRewardRuleSummary("code-786", "name-60");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
