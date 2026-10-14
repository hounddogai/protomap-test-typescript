import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedDeflectionAssignmentEngine } from "./weighted-deflection-assignment-engine.js";
import { newWeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

test("WeightedDeflectionAssignmentEngine keeps results within bounds", () => {
  const engine = defaultWeightedDeflectionAssignmentEngine(flags.newRegistry());
  const item = newWeightedDeflectionAssignment("code-995", "label-64");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
