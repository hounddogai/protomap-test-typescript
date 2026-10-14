import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLeaderboardAllocationEngine } from "./leaderboard-allocation-engine.js";
import { newLeaderboardAllocation } from "./leaderboard-allocation.js";

test("LeaderboardAllocationEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardAllocationEngine(flags.newRegistry());
  const item = newLeaderboardAllocation("code-371", "name-363");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
