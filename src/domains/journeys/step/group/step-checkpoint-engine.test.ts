import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStepCheckpointEngine } from "./step-checkpoint-engine.js";
import { newStepCheckpoint } from "./step-checkpoint.js";

test("StepCheckpointEngine keeps results within bounds", () => {
  const engine = defaultStepCheckpointEngine(flags.newRegistry());
  const item = newStepCheckpoint("code-501", "label-24");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
