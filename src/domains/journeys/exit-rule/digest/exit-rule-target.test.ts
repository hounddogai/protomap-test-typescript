import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleTarget } from "./exit-rule-target.js";

test("ExitRuleTarget starts in draft", () => {
  const item = newExitRuleTarget("code-694", "name-827");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleTarget moves to active", () => {
  const item = newExitRuleTarget("code-694", "name-827");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("ExitRuleTarget rejects moves from closed", () => {
  const item = newExitRuleTarget("code-694", "name-827");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
