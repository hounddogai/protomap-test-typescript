import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedMentionCycleEngine } from "./weighted-mention-cycle-engine.js";
import { newWeightedMentionCycle } from "./weighted-mention-cycle.js";

test("WeightedMentionCycleEngine keeps results within bounds", () => {
  const engine = defaultWeightedMentionCycleEngine();
  const item = newWeightedMentionCycle("code-232", "label-449");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
