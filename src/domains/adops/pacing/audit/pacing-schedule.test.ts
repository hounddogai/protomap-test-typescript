import assert from "node:assert/strict";
import { test } from "node:test";
import { newPacingSchedule } from "./pacing-schedule.js";

test("PacingSchedule starts in created", () => {
  const item = newPacingSchedule("code-988", "label-350");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PacingSchedule moves to published", () => {
  const item = newPacingSchedule("code-988", "label-350");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("PacingSchedule rejects moves from retired", () => {
  const item = newPacingSchedule("code-988", "label-350");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
