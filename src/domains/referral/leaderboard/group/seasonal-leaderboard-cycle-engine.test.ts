import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalLeaderboardCycleEngine } from "./seasonal-leaderboard-cycle-engine.js";
import { newSeasonalLeaderboardCycle } from "./seasonal-leaderboard-cycle.js";

test("SeasonalLeaderboardCycleEngine keeps results within bounds", () => {
  const engine = defaultSeasonalLeaderboardCycleEngine(flags.newRegistry());
  const item = newSeasonalLeaderboardCycle("code-574", "label-575");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
