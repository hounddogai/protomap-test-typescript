import assert from "node:assert/strict";
import { test } from "node:test";
import { newNudgeCheckpoint } from "./nudge-checkpoint.js";

test("NudgeCheckpoint starts in requested", () => {
  const item = newNudgeCheckpoint("code-734", "name-714");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("NudgeCheckpoint moves to expired", () => {
  const item = newNudgeCheckpoint("code-734", "name-714");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("NudgeCheckpoint rejects moves from expired", () => {
  const item = newNudgeCheckpoint("code-734", "name-714");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
