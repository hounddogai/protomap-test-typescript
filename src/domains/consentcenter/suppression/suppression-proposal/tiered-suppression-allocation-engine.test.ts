import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredSuppressionAllocationEngine } from "./tiered-suppression-allocation-engine.js";
import { newTieredSuppressionAllocation } from "./tiered-suppression-allocation.js";

test("TieredSuppressionAllocationEngine keeps results within bounds", () => {
  const engine = defaultTieredSuppressionAllocationEngine(flags.newRegistry());
  const item = newTieredSuppressionAllocation("code-233", "title-139");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
