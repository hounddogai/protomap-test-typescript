import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyInviteBatch } from "./legacy-invite-batch.js";

test("LegacyInviteBatch starts in new", () => {
  const item = newLegacyInviteBatch("code-716", "name-142");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyInviteBatch moves to running", () => {
  const item = newLegacyInviteBatch("code-716", "name-142");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("LegacyInviteBatch rejects moves from failed", () => {
  const item = newLegacyInviteBatch("code-716", "name-142");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
