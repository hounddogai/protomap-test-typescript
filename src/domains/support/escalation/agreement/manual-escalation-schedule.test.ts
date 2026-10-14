import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualEscalationSchedule } from "./manual-escalation-schedule.js";

test("ManualEscalationSchedule starts in planned", () => {
  const item = newManualEscalationSchedule("code-940", "title-481");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualEscalationSchedule moves to in progress", () => {
  const item = newManualEscalationSchedule("code-940", "title-481");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ManualEscalationSchedule rejects moves from cancelled", () => {
  const item = newManualEscalationSchedule("code-940", "title-481");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
