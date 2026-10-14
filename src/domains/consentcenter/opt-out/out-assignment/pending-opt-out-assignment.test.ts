import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingOptOutAssignment } from "./pending-opt-out-assignment.js";

test("PendingOptOutAssignment starts in proposed", () => {
  const item = newPendingOptOutAssignment("code-155", "title-209");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingOptOutAssignment moves to approved", () => {
  const item = newPendingOptOutAssignment("code-155", "title-209");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PendingOptOutAssignment rejects moves from withdrawn", () => {
  const item = newPendingOptOutAssignment("code-155", "title-209");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
