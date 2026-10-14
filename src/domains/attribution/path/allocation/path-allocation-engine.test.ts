import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPathAllocationEngine } from "./path-allocation-engine.js";
import { newPathAllocation } from "./path-allocation.js";

test("PathAllocationEngine keeps results within bounds", () => {
  const engine = defaultPathAllocationEngine();
  const item = newPathAllocation("code-493", "label-368");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
