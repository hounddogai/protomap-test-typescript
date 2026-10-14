import assert from "node:assert/strict";
import { test } from "node:test";
import { newAdaptiveLeaderboardMetric } from "./adaptive-leaderboard-metric.js";

test("AdaptiveLeaderboardMetric starts in planned", () => {
  const item = newAdaptiveLeaderboardMetric("code-769", "name-413");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("AdaptiveLeaderboardMetric moves to cancelled", () => {
  const item = newAdaptiveLeaderboardMetric("code-769", "name-413");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("AdaptiveLeaderboardMetric rejects moves from cancelled", () => {
  const item = newAdaptiveLeaderboardMetric("code-769", "name-413");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
