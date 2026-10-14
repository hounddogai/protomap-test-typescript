import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalSubscriptionAllocationEngine } from "./regional-subscription-allocation-engine.js";
import { newRegionalSubscriptionAllocation } from "./regional-subscription-allocation.js";

test("RegionalSubscriptionAllocationEngine keeps results within bounds", () => {
  const engine = defaultRegionalSubscriptionAllocationEngine();
  const item = newRegionalSubscriptionAllocation("code-533", "label-821");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
