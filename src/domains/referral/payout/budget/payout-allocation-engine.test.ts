import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayoutAllocationEngine } from "./payout-allocation-engine.js";
import { newPayoutAllocation } from "./payout-allocation.js";

test("PayoutAllocationEngine keeps results within bounds", () => {
  const engine = defaultPayoutAllocationEngine();
  const item = newPayoutAllocation("code-821", "title-522");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
