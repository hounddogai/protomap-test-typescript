import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSubscriptionAllocationEngine } from "./subscription-allocation-engine.js";
import { newSubscriptionAllocation } from "./subscription-allocation.js";

test("SubscriptionAllocationEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionAllocationEngine(flags.newRegistry());
  const item = newSubscriptionAllocation("code-379", "title-875");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
