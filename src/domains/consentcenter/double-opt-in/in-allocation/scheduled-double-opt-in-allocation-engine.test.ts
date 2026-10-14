import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledDoubleOptInAllocationEngine } from "./scheduled-double-opt-in-allocation-engine.js";
import { newScheduledDoubleOptInAllocation } from "./scheduled-double-opt-in-allocation.js";

test("ScheduledDoubleOptInAllocationEngine keeps results within bounds", () => {
  const engine = defaultScheduledDoubleOptInAllocationEngine();
  const item = newScheduledDoubleOptInAllocation("code-80", "label-111");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
