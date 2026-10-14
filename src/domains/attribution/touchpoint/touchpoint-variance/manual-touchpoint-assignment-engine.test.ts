import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualTouchpointAssignmentEngine } from "./manual-touchpoint-assignment-engine.js";
import { newManualTouchpointAssignment } from "./manual-touchpoint-assignment.js";

test("ManualTouchpointAssignmentEngine keeps results within bounds", () => {
  const engine = defaultManualTouchpointAssignmentEngine();
  const item = newManualTouchpointAssignment("code-956", "name-254");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
