import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightAllocationEngine } from "./insight-allocation-engine.js";
import { newInsightAllocation } from "./insight-allocation.js";

test("InsightAllocationEngine keeps results within bounds", () => {
  const engine = defaultInsightAllocationEngine(flags.newRegistry());
  const item = newInsightAllocation("code-429", "name-639");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
