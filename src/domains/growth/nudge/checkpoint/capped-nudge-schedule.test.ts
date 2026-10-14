import assert from "node:assert/strict";
import { test } from "node:test";
import { newCappedNudgeSchedule } from "./capped-nudge-schedule.js";

test("CappedNudgeSchedule starts in idle", () => {
  const item = newCappedNudgeSchedule("code-43", "title-898");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CappedNudgeSchedule moves to warming", () => {
  const item = newCappedNudgeSchedule("code-43", "title-898");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("CappedNudgeSchedule rejects moves from stopped", () => {
  const item = newCappedNudgeSchedule("code-43", "title-898");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
