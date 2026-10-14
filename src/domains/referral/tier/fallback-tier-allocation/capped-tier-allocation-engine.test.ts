import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedTierAllocationEngine } from "./capped-tier-allocation-engine.js";
import { newCappedTierAllocation } from "./capped-tier-allocation.js";

test("CappedTierAllocationEngine keeps results within bounds", () => {
  const engine = defaultCappedTierAllocationEngine(flags.newRegistry());
  const item = newCappedTierAllocation("code-74", "title-239");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
