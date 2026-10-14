import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredLeaderboardMapping } from "./tiered-leaderboard-mapping.js";

test("TieredLeaderboardMapping starts in idle", () => {
  const item = newTieredLeaderboardMapping("code-201", "label-889");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredLeaderboardMapping moves to warming", () => {
  const item = newTieredLeaderboardMapping("code-201", "label-889");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("TieredLeaderboardMapping rejects moves from stopped", () => {
  const item = newTieredLeaderboardMapping("code-201", "label-889");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
