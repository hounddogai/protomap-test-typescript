import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCohortSlotEngine } from "./cohort-slot-engine.js";
import { newCohortSlot } from "./cohort-slot.js";

test("CohortSlotEngine keeps results within bounds", () => {
  const engine = defaultCohortSlotEngine(flags.newRegistry());
  const item = newCohortSlot("code-362", "label-838");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
