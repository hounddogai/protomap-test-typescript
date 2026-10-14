import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveExitRuleBundle } from "./adaptive-exit-rule-bundle.js";

test("AdaptiveExitRuleBundle starts in planned", () => {
  const item = newAdaptiveExitRuleBundle("code-735", "name-698");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveExitRuleBundle moves to scheduled", () => {
  const item = newAdaptiveExitRuleBundle("code-735", "name-698");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("AdaptiveExitRuleBundle rejects moves from cancelled", () => {
  const item = newAdaptiveExitRuleBundle("code-735", "name-698");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
