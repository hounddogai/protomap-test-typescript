import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyInviteAdjustment } from "./legacy-invite-adjustment.js";

test("LegacyInviteAdjustment starts in idle", () => {
  const item = newLegacyInviteAdjustment("code-588", "name-517");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyInviteAdjustment moves to stopped", () => {
  const item = newLegacyInviteAdjustment("code-588", "name-517");
  try {
    item.moveTo("stopped");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "stopped", "status");
});

test("LegacyInviteAdjustment rejects moves from stopped", () => {
  const item = newLegacyInviteAdjustment("code-588", "name-517");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
