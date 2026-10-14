import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledSenderCheckpoint } from "./scheduled-sender-checkpoint.js";

test("ScheduledSenderCheckpoint starts in planned", () => {
  const item = newScheduledSenderCheckpoint("code-218", "label-987");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledSenderCheckpoint moves to scheduled", () => {
  const item = newScheduledSenderCheckpoint("code-218", "label-987");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("ScheduledSenderCheckpoint rejects moves from cancelled", () => {
  const item = newScheduledSenderCheckpoint("code-218", "label-987");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
