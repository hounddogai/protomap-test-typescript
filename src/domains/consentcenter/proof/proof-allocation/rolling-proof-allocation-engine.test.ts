import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingProofAllocationEngine } from "./rolling-proof-allocation-engine.js";
import { newRollingProofAllocation } from "./rolling-proof-allocation.js";

test("RollingProofAllocationEngine keeps results within bounds", () => {
  const engine = defaultRollingProofAllocationEngine(flags.newRegistry());
  const item = newRollingProofAllocation("code-410", "title-346");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
