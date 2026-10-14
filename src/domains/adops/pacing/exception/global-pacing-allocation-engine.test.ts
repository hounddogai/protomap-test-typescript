import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalPacingAllocationEngine } from "./global-pacing-allocation-engine.js";
import { newGlobalPacingAllocation } from "./global-pacing-allocation.js";

test("GlobalPacingAllocationEngine keeps results within bounds", () => {
  const engine = defaultGlobalPacingAllocationEngine(flags.newRegistry());
  const item = newGlobalPacingAllocation("code-146", "name-364");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
