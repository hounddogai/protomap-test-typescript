import assert from "node:assert/strict";
import { test } from "node:test";
import { newBatchedInviteNotice } from "./batched-invite-notice.js";

test("BatchedInviteNotice starts in open", () => {
  const item = newBatchedInviteNotice("code-748", "name-649");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BatchedInviteNotice moves to archived", () => {
  const item = newBatchedInviteNotice("code-748", "name-649");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("BatchedInviteNotice rejects moves from archived", () => {
  const item = newBatchedInviteNotice("code-748", "name-649");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
