import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingInviteSlot } from "./pending-invite-slot.js";

test("PendingInviteSlot starts in draft", () => {
  const item = newPendingInviteSlot("code-759", "title-762");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingInviteSlot moves to suspended", () => {
  const item = newPendingInviteSlot("code-759", "title-762");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PendingInviteSlot rejects moves from closed", () => {
  const item = newPendingInviteSlot("code-759", "title-762");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
