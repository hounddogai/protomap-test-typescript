import assert from "node:assert/strict";
import { test } from "node:test";
import { newExitRuleSchedule } from "./exit-rule-schedule.js";

test("ExitRuleSchedule starts in open", () => {
  const item = newExitRuleSchedule("code-638", "label-911");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ExitRuleSchedule moves to resolved", () => {
  const item = newExitRuleSchedule("code-638", "label-911");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ExitRuleSchedule rejects moves from archived", () => {
  const item = newExitRuleSchedule("code-638", "label-911");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
