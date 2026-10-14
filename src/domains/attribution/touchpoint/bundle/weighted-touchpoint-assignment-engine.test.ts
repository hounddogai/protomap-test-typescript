import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedTouchpointAssignmentEngine } from "./weighted-touchpoint-assignment-engine.js";
import { newWeightedTouchpointAssignment } from "./weighted-touchpoint-assignment.js";

test("WeightedTouchpointAssignmentEngine keeps results within bounds", () => {
  const engine = defaultWeightedTouchpointAssignmentEngine(flags.newRegistry());
  const item = newWeightedTouchpointAssignment("code-84", "label-815");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
