import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictBounceCycleEngine } from "./strict-bounce-cycle-engine.js";
import { newStrictBounceCycle } from "./strict-bounce-cycle.js";

test("StrictBounceCycleEngine keeps results within bounds", () => {
  const engine = defaultStrictBounceCycleEngine();
  const item = newStrictBounceCycle("code-961", "name-664");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
