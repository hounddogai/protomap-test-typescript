import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedProofAssignmentEngine } from "./weighted-proof-assignment-engine.js";
import { newWeightedProofAssignment } from "./weighted-proof-assignment.js";

test("WeightedProofAssignmentEngine keeps results within bounds", () => {
  const engine = defaultWeightedProofAssignmentEngine(flags.newRegistry());
  const item = newWeightedProofAssignment("code-577", "name-347");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
