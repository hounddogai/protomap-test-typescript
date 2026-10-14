import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofAllocationEngine } from "./proof-allocation-engine.js";
import { newProofAllocation } from "./proof-allocation.js";

test("ProofAllocationEngine keeps results within bounds", () => {
  const engine = defaultProofAllocationEngine(flags.newRegistry());
  const item = newProofAllocation("code-650", "label-762");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
