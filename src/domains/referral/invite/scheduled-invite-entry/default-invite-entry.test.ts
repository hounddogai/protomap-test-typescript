import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultInviteEntry } from "./default-invite-entry.js";

test("DefaultInviteEntry starts in new", () => {
  const item = newDefaultInviteEntry("code-636", "name-966");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultInviteEntry moves to done", () => {
  const item = newDefaultInviteEntry("code-636", "name-966");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("DefaultInviteEntry rejects moves from failed", () => {
  const item = newDefaultInviteEntry("code-636", "name-966");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
