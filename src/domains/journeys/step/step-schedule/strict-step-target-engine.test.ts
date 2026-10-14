import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictStepTargetEngine } from "./strict-step-target-engine.js";
import { newStrictStepTarget } from "./strict-step-target.js";

test("StrictStepTargetEngine keeps results within bounds", () => {
  const engine = defaultStrictStepTargetEngine();
  const item = newStrictStepTarget("code-675", "title-963");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
