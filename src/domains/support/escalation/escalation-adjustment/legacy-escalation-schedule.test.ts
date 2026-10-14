import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyEscalationSchedule } from "./legacy-escalation-schedule.js";

test("LegacyEscalationSchedule starts in draft", () => {
  const item = newLegacyEscalationSchedule("code-223", "name-425");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyEscalationSchedule moves to active", () => {
  const item = newLegacyEscalationSchedule("code-223", "name-425");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("LegacyEscalationSchedule rejects moves from closed", () => {
  const item = newLegacyEscalationSchedule("code-223", "name-425");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
