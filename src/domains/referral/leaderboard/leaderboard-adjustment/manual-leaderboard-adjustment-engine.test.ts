import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualLeaderboardAdjustmentEngine } from "./manual-leaderboard-adjustment-engine.js";
import { newManualLeaderboardAdjustment } from "./manual-leaderboard-adjustment.js";

test("ManualLeaderboardAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultManualLeaderboardAdjustmentEngine();
  const item = newManualLeaderboardAdjustment("code-125", "title-667");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
