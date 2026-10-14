import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleMilestone } from "./exit-rule-milestone.js";

test("ExitRuleMilestone starts in open", () => {
  const item = newExitRuleMilestone("code-70", "label-249");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleMilestone moves to resolved", () => {
  const item = newExitRuleMilestone("code-70", "label-249");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ExitRuleMilestone rejects moves from archived", () => {
  const item = newExitRuleMilestone("code-70", "label-249");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
