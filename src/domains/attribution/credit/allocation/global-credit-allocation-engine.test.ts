import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalCreditAllocationEngine } from "./global-credit-allocation-engine.js";
import { newGlobalCreditAllocation } from "./global-credit-allocation.js";

test("GlobalCreditAllocationEngine keeps results within bounds", () => {
  const engine = defaultGlobalCreditAllocationEngine(flags.newRegistry());
  const item = newGlobalCreditAllocation("code-658", "label-795");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
