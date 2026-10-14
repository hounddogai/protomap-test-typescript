import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStepTierEngine } from "./step-tier-engine.js";
import { newStepTier } from "./step-tier.js";

test("StepTierEngine keeps results within bounds", () => {
  const engine = defaultStepTierEngine(flags.newRegistry());
  const item = newStepTier("code-626", "title-909");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
