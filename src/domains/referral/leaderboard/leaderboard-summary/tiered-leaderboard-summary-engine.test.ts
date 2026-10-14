import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredLeaderboardSummaryEngine } from "./tiered-leaderboard-summary-engine.js";
import { newTieredLeaderboardSummary } from "./tiered-leaderboard-summary.js";

test("TieredLeaderboardSummaryEngine keeps results within bounds", () => {
  const engine = defaultTieredLeaderboardSummaryEngine(flags.newRegistry());
  const item = newTieredLeaderboardSummary("code-188", "title-258");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
