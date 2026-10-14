import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleOverride } from "./exit-rule-override.js";

test("ExitRuleOverride starts in proposed", () => {
  const item = newExitRuleOverride("code-448", "name-527");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleOverride moves to approved", () => {
  const item = newExitRuleOverride("code-448", "name-527");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("ExitRuleOverride rejects moves from withdrawn", () => {
  const item = newExitRuleOverride("code-448", "name-527");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
