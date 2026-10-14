import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteDigest } from "./invite-digest.js";

test("InviteDigest starts in requested", () => {
  const item = newInviteDigest("code-747", "title-222");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteDigest moves to expired", () => {
  const item = newInviteDigest("code-747", "title-222");
  try {
    item.moveTo("expired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "expired", "status");
});

test("InviteDigest rejects moves from expired", () => {
  const item = newInviteDigest("code-747", "title-222");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
