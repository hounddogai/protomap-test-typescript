import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardVariance } from "./leaderboard-variance.js";

test("LeaderboardVariance starts in requested", () => {
  const item = newLeaderboardVariance("code-343", "label-535");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardVariance moves to revoked", () => {
  const item = newLeaderboardVariance("code-343", "label-535");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("LeaderboardVariance rejects moves from expired", () => {
  const item = newLeaderboardVariance("code-343", "label-535");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
