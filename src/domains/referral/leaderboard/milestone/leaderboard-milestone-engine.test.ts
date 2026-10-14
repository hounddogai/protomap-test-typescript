import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardMilestoneEngine } from "./leaderboard-milestone-engine.js";
import { newLeaderboardMilestone } from "./leaderboard-milestone.js";

test("LeaderboardMilestoneEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardMilestoneEngine();
  const item = newLeaderboardMilestone("code-841", "label-99");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
