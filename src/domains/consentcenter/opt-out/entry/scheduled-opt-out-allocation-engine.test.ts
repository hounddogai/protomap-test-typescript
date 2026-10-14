import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledOptOutAllocationEngine } from "./scheduled-opt-out-allocation-engine.js";
import { newScheduledOptOutAllocation } from "./scheduled-opt-out-allocation.js";

test("ScheduledOptOutAllocationEngine keeps results within bounds", () => {
  const engine = defaultScheduledOptOutAllocationEngine();
  const item = newScheduledOptOutAllocation("code-859", "title-873");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
