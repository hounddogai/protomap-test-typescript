import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStepClaimEngine } from "./step-claim-engine.js";
import { newStepClaim } from "./step-claim.js";

test("StepClaimEngine keeps results within bounds", () => {
  const engine = defaultStepClaimEngine(flags.newRegistry());
  const item = newStepClaim("code-623", "label-53");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
