import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedInviteSchedule } from "./batched-invite-schedule.js";

test("BatchedInviteSchedule starts in new", () => {
  const item = newBatchedInviteSchedule("code-922", "title-407");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedInviteSchedule moves to running", () => {
  const item = newBatchedInviteSchedule("code-922", "title-407");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("BatchedInviteSchedule rejects moves from failed", () => {
  const item = newBatchedInviteSchedule("code-922", "title-407");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
