import assert from "node:assert/strict";
import { test } from "node:test";
import { newLegacyStreakTier } from "./legacy-streak-tier.js";

test("LegacyStreakTier starts in idle", () => {
  const item = newLegacyStreakTier("code-855", "name-675");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LegacyStreakTier moves to warming", () => {
  const item = newLegacyStreakTier("code-855", "name-675");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("LegacyStreakTier rejects moves from stopped", () => {
  const item = newLegacyStreakTier("code-855", "name-675");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
