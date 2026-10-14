import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierAllocationEngine } from "./tier-allocation-engine.js";
import { newTierAllocation } from "./tier-allocation.js";

test("TierAllocationEngine keeps results within bounds", () => {
  const engine = defaultTierAllocationEngine(flags.newRegistry());
  const item = newTierAllocation("code-488", "name-422");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
