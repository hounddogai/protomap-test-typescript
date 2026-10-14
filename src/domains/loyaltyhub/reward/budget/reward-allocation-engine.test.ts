import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardAllocationEngine } from "./reward-allocation-engine.js";
import { newRewardAllocation } from "./reward-allocation.js";

test("RewardAllocationEngine keeps results within bounds", () => {
  const engine = defaultRewardAllocationEngine();
  const item = newRewardAllocation("code-824", "label-919");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
