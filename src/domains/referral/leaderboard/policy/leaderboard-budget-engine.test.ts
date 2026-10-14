import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLeaderboardBudgetEngine } from "./leaderboard-budget-engine.js";
import { newLeaderboardBudget } from "./leaderboard-budget.js";

test("LeaderboardBudgetEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardBudgetEngine(flags.newRegistry());
  const item = newLeaderboardBudget("code-714", "name-69");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
