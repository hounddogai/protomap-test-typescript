import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyInviteRule } from "./legacy-invite-rule.js";

test("LegacyInviteRule starts in new", () => {
  const item = newLegacyInviteRule("code-674", "name-858");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyInviteRule moves to running", () => {
  const item = newLegacyInviteRule("code-674", "name-858");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyInviteRule rejects moves from failed", () => {
  const item = newLegacyInviteRule("code-674", "name-858");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
