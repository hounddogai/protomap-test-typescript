import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedExitRuleCycleEngine } from "./weighted-exit-rule-cycle-engine.js";
import { newWeightedExitRuleCycle } from "./weighted-exit-rule-cycle.js";

test("WeightedExitRuleCycleEngine keeps results within bounds", () => {
  const engine = defaultWeightedExitRuleCycleEngine();
  const item = newWeightedExitRuleCycle("code-240", "title-355");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
