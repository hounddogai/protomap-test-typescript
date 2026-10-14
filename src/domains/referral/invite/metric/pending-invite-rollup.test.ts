import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingInviteRollup } from "./pending-invite-rollup.js";

test("PendingInviteRollup starts in open", () => {
  const item = newPendingInviteRollup("code-173", "title-251");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingInviteRollup moves to resolved", () => {
  const item = newPendingInviteRollup("code-173", "title-251");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("PendingInviteRollup rejects moves from archived", () => {
  const item = newPendingInviteRollup("code-173", "title-251");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
