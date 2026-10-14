import assert from "node:assert/strict";
import { test } from "node:test";
import { newWeightedInviteManifest } from "./weighted-invite-manifest.js";

test("WeightedInviteManifest starts in new", () => {
  const item = newWeightedInviteManifest("code-246", "name-349");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("WeightedInviteManifest moves to running", () => {
  const item = newWeightedInviteManifest("code-246", "name-349");
  try {
    item.moveTo("running");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "running", "status");
});

test("WeightedInviteManifest rejects moves from failed", () => {
  const item = newWeightedInviteManifest("code-246", "name-349");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
