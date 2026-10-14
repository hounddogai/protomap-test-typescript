import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalStreakSchedule } from "./regional-streak-schedule.js";

test("RegionalStreakSchedule starts in idle", () => {
  const item = newRegionalStreakSchedule("code-342", "label-732");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalStreakSchedule moves to warming", () => {
  const item = newRegionalStreakSchedule("code-342", "label-732");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("RegionalStreakSchedule rejects moves from stopped", () => {
  const item = newRegionalStreakSchedule("code-342", "label-732");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
