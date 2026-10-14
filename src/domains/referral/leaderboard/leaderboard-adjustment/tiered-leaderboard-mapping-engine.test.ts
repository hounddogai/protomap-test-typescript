import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredLeaderboardMappingEngine } from "./tiered-leaderboard-mapping-engine.js";
import { newTieredLeaderboardMapping } from "./tiered-leaderboard-mapping.js";

test("TieredLeaderboardMappingEngine keeps results within bounds", () => {
  const engine = defaultTieredLeaderboardMappingEngine(flags.newRegistry());
  const item = newTieredLeaderboardMapping("code-201", "label-889");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
