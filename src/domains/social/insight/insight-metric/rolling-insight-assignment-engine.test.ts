import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingInsightAssignmentEngine } from "./rolling-insight-assignment-engine.js";
import { newRollingInsightAssignment } from "./rolling-insight-assignment.js";

test("RollingInsightAssignmentEngine keeps results within bounds", () => {
  const engine = defaultRollingInsightAssignmentEngine(flags.newRegistry());
  const item = newRollingInsightAssignment("code-951", "name-551");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
