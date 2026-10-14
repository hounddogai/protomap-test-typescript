import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveLeaderboardBaseline } from "./adaptive-leaderboard-baseline.js";

test("AdaptiveLeaderboardBaseline starts in planned", () => {
  const item = newAdaptiveLeaderboardBaseline("code-913", "name-397");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveLeaderboardBaseline moves to cancelled", () => {
  const item = newAdaptiveLeaderboardBaseline("code-913", "name-397");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("AdaptiveLeaderboardBaseline rejects moves from cancelled", () => {
  const item = newAdaptiveLeaderboardBaseline("code-913", "name-397");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
