import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalLeaderboardPlanEngine } from "./global-leaderboard-plan-engine.js";
import { newGlobalLeaderboardPlan } from "./global-leaderboard-plan.js";

test("GlobalLeaderboardPlanEngine keeps results within bounds", () => {
  const engine = defaultGlobalLeaderboardPlanEngine(flags.newRegistry());
  const item = newGlobalLeaderboardPlan("code-889", "name-908");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
