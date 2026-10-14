import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveLeaderboardMetricEngine } from "./adaptive-leaderboard-metric-engine.js";
import { newAdaptiveLeaderboardMetric } from "./adaptive-leaderboard-metric.js";

test("AdaptiveLeaderboardMetricEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveLeaderboardMetricEngine(flags.newRegistry());
  const item = newAdaptiveLeaderboardMetric("code-769", "name-413");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
