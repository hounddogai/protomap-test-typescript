import assert from "node:assert/strict";
import { test } from "node:test";
import { newStreakSchedule } from "./streak-schedule.js";

test("StreakSchedule starts in planned", () => {
  const item = newStreakSchedule("code-696", "label-292");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("StreakSchedule moves to scheduled", () => {
  const item = newStreakSchedule("code-696", "label-292");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("StreakSchedule rejects moves from cancelled", () => {
  const item = newStreakSchedule("code-696", "label-292");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
