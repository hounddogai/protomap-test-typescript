import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictCsatAllocationEngine } from "./strict-csat-allocation-engine.js";
import { newStrictCsatAllocation } from "./strict-csat-allocation.js";

test("StrictCsatAllocationEngine keeps results within bounds", () => {
  const engine = defaultStrictCsatAllocationEngine(flags.newRegistry());
  const item = newStrictCsatAllocation("code-685", "label-106");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
