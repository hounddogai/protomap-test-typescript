import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLeaderboardVarianceEngine } from "./leaderboard-variance-engine.js";
import { newLeaderboardVariance } from "./leaderboard-variance.js";

test("LeaderboardVarianceEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardVarianceEngine(flags.newRegistry());
  const item = newLeaderboardVariance("code-343", "label-535");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
