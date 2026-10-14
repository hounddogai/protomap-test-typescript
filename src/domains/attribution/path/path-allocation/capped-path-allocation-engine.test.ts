import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedPathAllocationEngine } from "./capped-path-allocation-engine.js";
import { newCappedPathAllocation } from "./capped-path-allocation.js";

test("CappedPathAllocationEngine keeps results within bounds", () => {
  const engine = defaultCappedPathAllocationEngine();
  const item = newCappedPathAllocation("code-789", "name-715");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
