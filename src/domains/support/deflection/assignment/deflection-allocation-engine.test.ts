import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionAllocationEngine } from "./deflection-allocation-engine.js";
import { newDeflectionAllocation } from "./deflection-allocation.js";

test("DeflectionAllocationEngine keeps results within bounds", () => {
  const engine = defaultDeflectionAllocationEngine(flags.newRegistry());
  const item = newDeflectionAllocation("code-6", "title-809");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
