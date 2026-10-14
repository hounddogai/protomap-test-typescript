import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

test("RollingNudgeCheckpoint starts in proposed", () => {
  const item = newRollingNudgeCheckpoint("code-813", "name-830");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingNudgeCheckpoint moves to rejected", () => {
  const item = newRollingNudgeCheckpoint("code-813", "name-830");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RollingNudgeCheckpoint rejects moves from withdrawn", () => {
  const item = newRollingNudgeCheckpoint("code-813", "name-830");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
