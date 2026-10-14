import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyExitRuleSchedule } from "./legacy-exit-rule-schedule.js";

test("LegacyExitRuleSchedule starts in open", () => {
  const item = newLegacyExitRuleSchedule("code-350", "name-151");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyExitRuleSchedule moves to resolved", () => {
  const item = newLegacyExitRuleSchedule("code-350", "name-151");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("LegacyExitRuleSchedule rejects moves from archived", () => {
  const item = newLegacyExitRuleSchedule("code-350", "name-151");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
