import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalEscalationSchedule } from "./seasonal-escalation-schedule.js";

test("SeasonalEscalationSchedule starts in idle", () => {
  const item = newSeasonalEscalationSchedule("code-815", "name-358");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalEscalationSchedule moves to ready", () => {
  const item = newSeasonalEscalationSchedule("code-815", "name-358");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SeasonalEscalationSchedule rejects moves from stopped", () => {
  const item = newSeasonalEscalationSchedule("code-815", "name-358");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
