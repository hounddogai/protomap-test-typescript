import assert from "node:assert/strict";
import { test } from "node:test";
import { newReplyProfile } from "./reply-profile.js";

test("ReplyProfile starts in requested", () => {
  const item = newReplyProfile("code-32", "name-141");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ReplyProfile moves to revoked", () => {
  const item = newReplyProfile("code-32", "name-141");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("ReplyProfile rejects moves from expired", () => {
  const item = newReplyProfile("code-32", "name-141");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
