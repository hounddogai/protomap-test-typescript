import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalLeaderboardRollupEngine } from "./seasonal-leaderboard-rollup-engine.js";
import { newSeasonalLeaderboardRollup } from "./seasonal-leaderboard-rollup.js";

test("SeasonalLeaderboardRollupEngine keeps results within bounds", () => {
  const engine = defaultSeasonalLeaderboardRollupEngine(flags.newRegistry());
  const item = newSeasonalLeaderboardRollup("code-212", "title-72");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
