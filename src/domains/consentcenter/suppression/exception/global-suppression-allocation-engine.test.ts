import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalSuppressionAllocationEngine } from "./global-suppression-allocation-engine.js";
import { newGlobalSuppressionAllocation } from "./global-suppression-allocation.js";

test("GlobalSuppressionAllocationEngine keeps results within bounds", () => {
  const engine = defaultGlobalSuppressionAllocationEngine(flags.newRegistry());
  const item = newGlobalSuppressionAllocation("code-88", "title-781");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
