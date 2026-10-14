import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteBundle } from "./invite-bundle.js";

test("InviteBundle starts in open", () => {
  const item = newInviteBundle("code-964", "label-517");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteBundle moves to resolved", () => {
  const item = newInviteBundle("code-964", "label-517");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("InviteBundle rejects moves from archived", () => {
  const item = newInviteBundle("code-964", "label-517");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
