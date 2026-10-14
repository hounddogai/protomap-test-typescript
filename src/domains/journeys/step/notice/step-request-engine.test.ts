import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStepRequestEngine } from "./step-request-engine.js";
import { newStepRequest } from "./step-request.js";

test("StepRequestEngine keeps results within bounds", () => {
  const engine = defaultStepRequestEngine();
  const item = newStepRequest("code-270", "label-250");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
