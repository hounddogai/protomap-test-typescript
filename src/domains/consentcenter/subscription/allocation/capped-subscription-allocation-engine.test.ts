import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedSubscriptionAllocationEngine } from "./capped-subscription-allocation-engine.js";
import { newCappedSubscriptionAllocation } from "./capped-subscription-allocation.js";

test("CappedSubscriptionAllocationEngine keeps results within bounds", () => {
  const engine = defaultCappedSubscriptionAllocationEngine(flags.newRegistry());
  const item = newCappedSubscriptionAllocation("code-568", "name-182");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
