import assert from "node:assert/strict";
import { test } from "node:test";
import { newInvitePolicy } from "./invite-policy.js";

test("InvitePolicy starts in open", () => {
  const item = newInvitePolicy("code-881", "title-973");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InvitePolicy moves to resolved", () => {
  const item = newInvitePolicy("code-881", "title-973");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("InvitePolicy rejects moves from archived", () => {
  const item = newInvitePolicy("code-881", "title-973");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
