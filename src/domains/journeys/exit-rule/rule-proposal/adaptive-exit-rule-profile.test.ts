import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveExitRuleProfile } from "./adaptive-exit-rule-profile.js";

test("AdaptiveExitRuleProfile starts in open", () => {
  const item = newAdaptiveExitRuleProfile("code-35", "label-49");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveExitRuleProfile moves to in review", () => {
  const item = newAdaptiveExitRuleProfile("code-35", "label-49");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("AdaptiveExitRuleProfile rejects moves from archived", () => {
  const item = newAdaptiveExitRuleProfile("code-35", "label-49");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
