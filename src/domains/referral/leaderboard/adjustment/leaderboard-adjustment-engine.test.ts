import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardAdjustmentEngine } from "./leaderboard-adjustment-engine.js";
import { newLeaderboardAdjustment } from "./leaderboard-adjustment.js";

test("LeaderboardAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardAdjustmentEngine();
  const item = newLeaderboardAdjustment("code-611", "label-255");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
