import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingLevelAssignmentEngine } from "./rolling-level-assignment-engine.js";
import { newRollingLevelAssignment } from "./rolling-level-assignment.js";

test("RollingLevelAssignmentEngine keeps results within bounds", () => {
  const engine = defaultRollingLevelAssignmentEngine(flags.newRegistry());
  const item = newRollingLevelAssignment("code-945", "name-446");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
