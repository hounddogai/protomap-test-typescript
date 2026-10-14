import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchAllocationEngine } from "./branch-allocation-engine.js";
import { newBranchAllocation } from "./branch-allocation.js";

test("BranchAllocationEngine keeps results within bounds", () => {
  const engine = defaultBranchAllocationEngine();
  const item = newBranchAllocation("code-770", "name-39");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
