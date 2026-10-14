import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteMilestone } from "./invite-milestone.js";

test("InviteMilestone starts in planned", () => {
  const item = newInviteMilestone("code-897", "title-229");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteMilestone moves to scheduled", () => {
  const item = newInviteMilestone("code-897", "title-229");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("InviteMilestone rejects moves from cancelled", () => {
  const item = newInviteMilestone("code-897", "title-229");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
