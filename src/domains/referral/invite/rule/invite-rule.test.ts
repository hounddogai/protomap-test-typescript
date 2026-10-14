import assert from "node:assert/strict";
import { test } from "node:test";
import { newInviteRule } from "./invite-rule.js";

test("InviteRule starts in new", () => {
  const item = newInviteRule("code-674", "name-621");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("InviteRule moves to done", () => {
  const item = newInviteRule("code-674", "name-621");
  try {
    item.moveTo("done");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "done", "status");
});

test("InviteRule rejects moves from failed", () => {
  const item = newInviteRule("code-674", "name-621");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
