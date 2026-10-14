import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveLeaderboardSlot } from "./adaptive-leaderboard-slot.js";

test("AdaptiveLeaderboardSlot starts in requested", () => {
  const item = newAdaptiveLeaderboardSlot("code-834", "title-159");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveLeaderboardSlot moves to granted", () => {
  const item = newAdaptiveLeaderboardSlot("code-834", "title-159");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("AdaptiveLeaderboardSlot rejects moves from expired", () => {
  const item = newAdaptiveLeaderboardSlot("code-834", "title-159");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
