import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualLeaderboardRollup } from "./manual-leaderboard-rollup.js";

test("ManualLeaderboardRollup starts in planned", () => {
  const item = newManualLeaderboardRollup("code-434", "name-180");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualLeaderboardRollup moves to in progress", () => {
  const item = newManualLeaderboardRollup("code-434", "name-180");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("ManualLeaderboardRollup rejects moves from cancelled", () => {
  const item = newManualLeaderboardRollup("code-434", "name-180");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
