import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientApprovalCheckpoint } from "./lenient-approval-checkpoint.js";

test("LenientApprovalCheckpoint starts in planned", () => {
  const item = newLenientApprovalCheckpoint("code-763", "name-49");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientApprovalCheckpoint moves to in progress", () => {
  const item = newLenientApprovalCheckpoint("code-763", "name-49");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("LenientApprovalCheckpoint rejects moves from cancelled", () => {
  const item = newLenientApprovalCheckpoint("code-763", "name-49");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
