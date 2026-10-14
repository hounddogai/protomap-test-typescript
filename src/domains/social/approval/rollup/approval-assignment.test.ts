import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalAssignment } from "./approval-assignment.js";

test("ApprovalAssignment starts in requested", () => {
  const item = newApprovalAssignment("code-61", "title-716");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalAssignment moves to expired", () => {
  const item = newApprovalAssignment("code-61", "title-716");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("ApprovalAssignment rejects moves from expired", () => {
  const item = newApprovalAssignment("code-61", "title-716");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
