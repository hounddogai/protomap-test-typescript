import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBadgeProfile } from "./seasonal-badge-profile.js";

test("SeasonalBadgeProfile starts in idle", () => {
  const item = newSeasonalBadgeProfile("code-800", "name-575");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBadgeProfile moves to ready", () => {
  const item = newSeasonalBadgeProfile("code-800", "name-575");
  try {
    item.moveTo("ready");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "ready", "status");
});

test("SeasonalBadgeProfile rejects moves from stopped", () => {
  const item = newSeasonalBadgeProfile("code-800", "name-575");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
