import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackActivationAllocationEngine } from "./fallback-activation-allocation-engine.js";
import { newFallbackActivationAllocation } from "./fallback-activation-allocation.js";

test("FallbackActivationAllocationEngine keeps results within bounds", () => {
  const engine = defaultFallbackActivationAllocationEngine(flags.newRegistry());
  const item = newFallbackActivationAllocation("code-429", "title-586");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
