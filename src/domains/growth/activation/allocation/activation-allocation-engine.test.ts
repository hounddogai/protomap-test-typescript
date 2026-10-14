import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationAllocationEngine } from "./activation-allocation-engine.js";
import { newActivationAllocation } from "./activation-allocation.js";

test("ActivationAllocationEngine keeps results within bounds", () => {
  const engine = defaultActivationAllocationEngine(flags.newRegistry());
  const item = newActivationAllocation("code-683", "label-415");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
