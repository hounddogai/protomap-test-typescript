import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalPlacementAllocationEngine } from "./regional-placement-allocation-engine.js";
import { newRegionalPlacementAllocation } from "./regional-placement-allocation.js";

test("RegionalPlacementAllocationEngine keeps results within bounds", () => {
  const engine = defaultRegionalPlacementAllocationEngine();
  const item = newRegionalPlacementAllocation("code-837", "title-520");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
