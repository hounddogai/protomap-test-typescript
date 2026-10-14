import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveLeaderboardSlotEngine } from "./adaptive-leaderboard-slot-engine.js";
import { newAdaptiveLeaderboardSlot } from "./adaptive-leaderboard-slot.js";

test("AdaptiveLeaderboardSlotEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveLeaderboardSlotEngine();
  const item = newAdaptiveLeaderboardSlot("code-834", "title-159");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
