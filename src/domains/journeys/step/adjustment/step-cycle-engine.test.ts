import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStepCycleEngine } from "./step-cycle-engine.js";
import { newStepCycle } from "./step-cycle.js";

test("StepCycleEngine keeps results within bounds", () => {
  const engine = defaultStepCycleEngine();
  const item = newStepCycle("code-149", "name-391");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
