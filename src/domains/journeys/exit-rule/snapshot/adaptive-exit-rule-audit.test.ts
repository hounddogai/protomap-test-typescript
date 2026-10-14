import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveExitRuleAudit } from "./adaptive-exit-rule-audit.js";

test("AdaptiveExitRuleAudit starts in created", () => {
  const item = newAdaptiveExitRuleAudit("code-54", "title-365");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveExitRuleAudit moves to validated", () => {
  const item = newAdaptiveExitRuleAudit("code-54", "title-365");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("AdaptiveExitRuleAudit rejects moves from retired", () => {
  const item = newAdaptiveExitRuleAudit("code-54", "title-365");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
