import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintAllocationEngine } from "./complaint-allocation-engine.js";
import { newComplaintAllocation } from "./complaint-allocation.js";

test("ComplaintAllocationEngine keeps results within bounds", () => {
  const engine = defaultComplaintAllocationEngine(flags.newRegistry());
  const item = newComplaintAllocation("code-694", "name-188");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
