import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteRequest } from "./invite-request.js";

test("InviteRequest starts in new", () => {
  const item = newInviteRequest("code-518", "title-601");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteRequest moves to queued", () => {
  const item = newInviteRequest("code-518", "title-601");
  try {
    item.moveTo("queued");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "queued", "status");
});

test("InviteRequest rejects moves from failed", () => {
  const item = newInviteRequest("code-518", "title-601");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
