import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedCsatSchedule } from "./capped-csat-schedule.js";

test("CappedCsatSchedule starts in planned", () => {
  const item = newCappedCsatSchedule("code-829", "title-742");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedCsatSchedule moves to in progress", () => {
  const item = newCappedCsatSchedule("code-829", "title-742");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CappedCsatSchedule rejects moves from cancelled", () => {
  const item = newCappedCsatSchedule("code-829", "title-742");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
