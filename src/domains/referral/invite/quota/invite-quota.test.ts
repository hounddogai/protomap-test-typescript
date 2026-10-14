import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteQuota } from "./invite-quota.js";

test("InviteQuota starts in planned", () => {
  const item = newInviteQuota("code-888", "title-684");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteQuota moves to scheduled", () => {
  const item = newInviteQuota("code-888", "title-684");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("InviteQuota rejects moves from cancelled", () => {
  const item = newInviteQuota("code-888", "title-684");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
