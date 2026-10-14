import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleAssignment } from "./exit-rule-assignment.js";

test("ExitRuleAssignment starts in requested", () => {
  const item = newExitRuleAssignment("code-4", "title-230");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleAssignment moves to granted", () => {
  const item = newExitRuleAssignment("code-4", "title-230");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("ExitRuleAssignment rejects moves from expired", () => {
  const item = newExitRuleAssignment("code-4", "title-230");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
