import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingLeaderboardMappingEngine } from "./pending-leaderboard-mapping-engine.js";
import { newPendingLeaderboardMapping } from "./pending-leaderboard-mapping.js";

test("PendingLeaderboardMappingEngine keeps results within bounds", () => {
  const engine = defaultPendingLeaderboardMappingEngine(flags.newRegistry());
  const item = newPendingLeaderboardMapping("code-689", "name-900");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
