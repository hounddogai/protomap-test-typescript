import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteEntry } from "./invite-entry.js";

test("InviteEntry starts in planned", () => {
  const item = newInviteEntry("code-796", "title-357");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteEntry moves to in progress", () => {
  const item = newInviteEntry("code-796", "title-357");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("InviteEntry rejects moves from cancelled", () => {
  const item = newInviteEntry("code-796", "title-357");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
