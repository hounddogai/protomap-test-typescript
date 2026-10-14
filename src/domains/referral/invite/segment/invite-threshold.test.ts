import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteThreshold } from "./invite-threshold.js";

test("InviteThreshold starts in draft", () => {
  const item = newInviteThreshold("code-555", "title-439");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteThreshold moves to pending", () => {
  const item = newInviteThreshold("code-555", "title-439");
  try {
    item.moveTo("pending");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "pending", "status");
});

test("InviteThreshold rejects moves from closed", () => {
  const item = newInviteThreshold("code-555", "title-439");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
