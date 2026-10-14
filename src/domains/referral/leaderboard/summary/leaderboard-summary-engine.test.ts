import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLeaderboardSummaryEngine } from "./leaderboard-summary-engine.js";
import { newLeaderboardSummary } from "./leaderboard-summary.js";

test("LeaderboardSummaryEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardSummaryEngine(flags.newRegistry());
  const item = newLeaderboardSummary("code-354", "label-172");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
