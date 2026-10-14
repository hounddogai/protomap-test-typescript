import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryLeaderboardAllocationEngine } from "./primary-leaderboard-allocation-engine.js";
import { newPrimaryLeaderboardAllocation } from "./primary-leaderboard-allocation.js";

test("PrimaryLeaderboardAllocationEngine keeps results within bounds", () => {
  const engine = defaultPrimaryLeaderboardAllocationEngine(flags.newRegistry());
  const item = newPrimaryLeaderboardAllocation("code-476", "label-476");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
