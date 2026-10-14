import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingReputationAllocationEngine } from "./pending-reputation-allocation-engine.js";
import { newPendingReputationAllocation } from "./pending-reputation-allocation.js";

test("PendingReputationAllocationEngine keeps results within bounds", () => {
  const engine = defaultPendingReputationAllocationEngine(flags.newRegistry());
  const item = newPendingReputationAllocation("code-111", "name-850");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
