import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveLeaderboardBaselineEngine } from "./adaptive-leaderboard-baseline-engine.js";
import { newAdaptiveLeaderboardBaseline } from "./adaptive-leaderboard-baseline.js";

test("AdaptiveLeaderboardBaselineEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveLeaderboardBaselineEngine();
  const item = newAdaptiveLeaderboardBaseline("code-913", "name-397");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
