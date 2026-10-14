import assert from "node:assert/strict";
import { test } from "node:test";
import { newChallengeSchedule } from "./challenge-schedule.js";

test("ChallengeSchedule starts in idle", () => {
  const item = newChallengeSchedule("code-435", "label-632");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ChallengeSchedule moves to warming", () => {
  const item = newChallengeSchedule("code-435", "label-632");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("ChallengeSchedule rejects moves from stopped", () => {
  const item = newChallengeSchedule("code-435", "label-632");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
