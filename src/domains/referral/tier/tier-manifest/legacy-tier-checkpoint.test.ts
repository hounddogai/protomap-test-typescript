import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyTierCheckpoint } from "./legacy-tier-checkpoint.js";

test("LegacyTierCheckpoint starts in idle", () => {
  const item = newLegacyTierCheckpoint("code-241", "label-915");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyTierCheckpoint moves to draining", () => {
  const item = newLegacyTierCheckpoint("code-241", "label-915");
  try {
    item.moveTo("draining");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "draining", "status");
});

test("LegacyTierCheckpoint rejects moves from stopped", () => {
  const item = newLegacyTierCheckpoint("code-241", "label-915");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
