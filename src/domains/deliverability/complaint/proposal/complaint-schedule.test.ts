import assert from "node:assert/strict";
import { test } from "node:test";
import { newComplaintSchedule } from "./complaint-schedule.js";

test("ComplaintSchedule starts in open", () => {
  const item = newComplaintSchedule("code-240", "label-646");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ComplaintSchedule moves to resolved", () => {
  const item = newComplaintSchedule("code-240", "label-646");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("ComplaintSchedule rejects moves from archived", () => {
  const item = newComplaintSchedule("code-240", "label-646");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
