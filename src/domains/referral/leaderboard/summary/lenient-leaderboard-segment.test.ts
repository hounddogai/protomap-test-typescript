import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientLeaderboardSegment } from "./lenient-leaderboard-segment.js";

test("LenientLeaderboardSegment starts in planned", () => {
  const item = newLenientLeaderboardSegment("code-70", "name-945");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientLeaderboardSegment moves to scheduled", () => {
  const item = newLenientLeaderboardSegment("code-70", "name-945");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("LenientLeaderboardSegment rejects moves from cancelled", () => {
  const item = newLenientLeaderboardSegment("code-70", "name-945");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
