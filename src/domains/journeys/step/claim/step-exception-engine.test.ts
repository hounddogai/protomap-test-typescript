import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStepExceptionEngine } from "./step-exception-engine.js";
import { newStepException } from "./step-exception.js";

test("StepExceptionEngine keeps results within bounds", () => {
  const engine = defaultStepExceptionEngine(flags.newRegistry());
  const item = newStepException("code-747", "label-461");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
