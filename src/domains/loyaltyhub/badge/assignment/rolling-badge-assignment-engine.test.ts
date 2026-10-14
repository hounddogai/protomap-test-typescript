import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingBadgeAssignmentEngine } from "./rolling-badge-assignment-engine.js";
import { newRollingBadgeAssignment } from "./rolling-badge-assignment.js";

test("RollingBadgeAssignmentEngine keeps results within bounds", () => {
  const engine = defaultRollingBadgeAssignmentEngine(flags.newRegistry());
  const item = newRollingBadgeAssignment("code-64", "label-677");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
