import assert from "node:assert/strict";
import { test } from "node:test";
import { newRollingInviteTier } from "./rolling-invite-tier.js";

test("RollingInviteTier starts in created", () => {
  const item = newRollingInviteTier("code-540", "name-86");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RollingInviteTier moves to published", () => {
  const item = newRollingInviteTier("code-540", "name-86");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("RollingInviteTier rejects moves from retired", () => {
  const item = newRollingInviteTier("code-540", "name-86");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
