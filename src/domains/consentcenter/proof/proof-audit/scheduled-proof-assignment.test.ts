import assert from "node:assert/strict";
import { test } from "node:test";
import { newScheduledProofAssignment } from "./scheduled-proof-assignment.js";

test("ScheduledProofAssignment starts in draft", () => {
  const item = newScheduledProofAssignment("code-467", "name-415");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ScheduledProofAssignment moves to pending", () => {
  const item = newScheduledProofAssignment("code-467", "name-415");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("ScheduledProofAssignment rejects moves from closed", () => {
  const item = newScheduledProofAssignment("code-467", "name-415");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
