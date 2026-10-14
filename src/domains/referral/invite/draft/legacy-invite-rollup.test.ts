import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyInviteRollup } from "./legacy-invite-rollup.js";

test("LegacyInviteRollup starts in idle", () => {
  const item = newLegacyInviteRollup("code-781", "title-573");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyInviteRollup moves to draining", () => {
  const item = newLegacyInviteRollup("code-781", "title-573");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LegacyInviteRollup rejects moves from stopped", () => {
  const item = newLegacyInviteRollup("code-781", "title-573");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
