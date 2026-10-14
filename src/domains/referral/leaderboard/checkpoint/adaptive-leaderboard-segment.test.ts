import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveLeaderboardSegment } from "./adaptive-leaderboard-segment.js";

test("AdaptiveLeaderboardSegment starts in proposed", () => {
  const item = newAdaptiveLeaderboardSegment("code-464", "name-382");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveLeaderboardSegment moves to approved", () => {
  const item = newAdaptiveLeaderboardSegment("code-464", "name-382");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("AdaptiveLeaderboardSegment rejects moves from withdrawn", () => {
  const item = newAdaptiveLeaderboardSegment("code-464", "name-382");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
