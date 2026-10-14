import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedStreakCycleEngine } from "./weighted-streak-cycle-engine.js";
import { newWeightedStreakCycle } from "./weighted-streak-cycle.js";

test("WeightedStreakCycleEngine keeps results within bounds", () => {
  const engine = defaultWeightedStreakCycleEngine(flags.newRegistry());
  const item = newWeightedStreakCycle("code-193", "label-70");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
