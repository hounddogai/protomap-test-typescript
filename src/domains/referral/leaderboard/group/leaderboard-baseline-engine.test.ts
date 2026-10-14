import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLeaderboardBaselineEngine } from "./leaderboard-baseline-engine.js";
import { newLeaderboardBaseline } from "./leaderboard-baseline.js";

test("LeaderboardBaselineEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardBaselineEngine();
  const item = newLeaderboardBaseline("code-781", "title-153");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
