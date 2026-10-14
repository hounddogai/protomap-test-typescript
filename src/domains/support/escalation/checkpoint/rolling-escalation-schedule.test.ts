import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingEscalationSchedule } from "./rolling-escalation-schedule.js";

test("RollingEscalationSchedule starts in created", () => {
  const item = newRollingEscalationSchedule("code-837", "label-657");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingEscalationSchedule moves to published", () => {
  const item = newRollingEscalationSchedule("code-837", "label-657");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RollingEscalationSchedule rejects moves from retired", () => {
  const item = newRollingEscalationSchedule("code-837", "label-657");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
