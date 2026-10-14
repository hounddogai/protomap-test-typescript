import assert from "node:assert/strict";
import { test } from "node:test";
import { newLeaderboardManifest } from "./leaderboard-manifest.js";

test("LeaderboardManifest starts in requested", () => {
  const item = newLeaderboardManifest("code-610", "name-309");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LeaderboardManifest moves to granted", () => {
  const item = newLeaderboardManifest("code-610", "name-309");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("LeaderboardManifest rejects moves from expired", () => {
  const item = newLeaderboardManifest("code-610", "name-309");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
