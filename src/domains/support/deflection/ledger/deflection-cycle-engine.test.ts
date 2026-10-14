import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDeflectionCycleEngine } from "./deflection-cycle-engine.js";
import { newDeflectionCycle } from "./deflection-cycle.js";

test("DeflectionCycleEngine keeps results within bounds", () => {
  const engine = defaultDeflectionCycleEngine();
  const item = newDeflectionCycle("code-481", "label-858");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
