import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredSubscriptionAllocationEngine } from "./tiered-subscription-allocation-engine.js";
import { newTieredSubscriptionAllocation } from "./tiered-subscription-allocation.js";

test("TieredSubscriptionAllocationEngine keeps results within bounds", () => {
  const engine = defaultTieredSubscriptionAllocationEngine();
  const item = newTieredSubscriptionAllocation("code-133", "title-644");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
