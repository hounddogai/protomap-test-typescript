import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOptOutAllocationEngine } from "./opt-out-allocation-engine.js";
import { newOptOutAllocation } from "./opt-out-allocation.js";

test("OptOutAllocationEngine keeps results within bounds", () => {
  const engine = defaultOptOutAllocationEngine();
  const item = newOptOutAllocation("code-971", "label-585");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
