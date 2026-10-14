import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLeaderboardMappingEngine } from "./leaderboard-mapping-engine.js";
import { newLeaderboardMapping } from "./leaderboard-mapping.js";

test("LeaderboardMappingEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardMappingEngine(flags.newRegistry());
  const item = newLeaderboardMapping("code-192", "name-295");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
