import assert from "node:assert/strict";
import { test } from "node:test";
import { newFallbackLeaderboardPolicy } from "./fallback-leaderboard-policy.js";

test("FallbackLeaderboardPolicy starts in requested", () => {
  const item = newFallbackLeaderboardPolicy("code-33", "name-506");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("FallbackLeaderboardPolicy moves to granted", () => {
  const item = newFallbackLeaderboardPolicy("code-33", "name-506");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("FallbackLeaderboardPolicy rejects moves from expired", () => {
  const item = newFallbackLeaderboardPolicy("code-33", "name-506");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
