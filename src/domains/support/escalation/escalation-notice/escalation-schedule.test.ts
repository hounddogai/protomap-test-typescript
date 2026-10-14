import assert from "node:assert/strict";
import { test } from "node:test";
import { newEscalationSchedule } from "./escalation-schedule.js";

test("EscalationSchedule starts in idle", () => {
  const item = newEscalationSchedule("code-441", "label-105");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("EscalationSchedule moves to draining", () => {
  const item = newEscalationSchedule("code-441", "label-105");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("EscalationSchedule rejects moves from stopped", () => {
  const item = newEscalationSchedule("code-441", "label-105");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
