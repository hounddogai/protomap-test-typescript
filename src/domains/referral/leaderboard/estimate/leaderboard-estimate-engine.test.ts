import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardEstimateEngine } from "./leaderboard-estimate-engine.js";
import { newLeaderboardEstimate } from "./leaderboard-estimate.js";

test("LeaderboardEstimateEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardEstimateEngine();
  const item = newLeaderboardEstimate("code-985", "label-644");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
