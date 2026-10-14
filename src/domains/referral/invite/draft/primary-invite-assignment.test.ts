import assert from "node:assert/strict";
import { test } from "node:test";
import { newPrimaryInviteAssignment } from "./primary-invite-assignment.js";

test("PrimaryInviteAssignment starts in proposed", () => {
  const item = newPrimaryInviteAssignment("code-998", "label-836");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PrimaryInviteAssignment moves to approved", () => {
  const item = newPrimaryInviteAssignment("code-998", "label-836");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("PrimaryInviteAssignment rejects moves from withdrawn", () => {
  const item = newPrimaryInviteAssignment("code-998", "label-836");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
