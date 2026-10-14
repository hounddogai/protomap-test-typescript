import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingEnrollmentProposal } from "./pending-enrollment-proposal.js";

test("PendingEnrollmentProposal starts in idle", () => {
  const item = newPendingEnrollmentProposal("code-716", "name-259");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingEnrollmentProposal moves to warming", () => {
  const item = newPendingEnrollmentProposal("code-716", "name-259");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PendingEnrollmentProposal rejects moves from stopped", () => {
  const item = newPendingEnrollmentProposal("code-716", "name-259");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
