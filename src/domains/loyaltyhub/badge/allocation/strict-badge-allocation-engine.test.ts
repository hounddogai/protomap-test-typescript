import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictBadgeAllocationEngine } from "./strict-badge-allocation-engine.js";
import { newStrictBadgeAllocation } from "./strict-badge-allocation.js";

test("StrictBadgeAllocationEngine keeps results within bounds", () => {
  const engine = defaultStrictBadgeAllocationEngine();
  const item = newStrictBadgeAllocation("code-522", "title-804");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
