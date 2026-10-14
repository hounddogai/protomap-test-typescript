import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDoubleOptInAssignmentEngine } from "./double-opt-in-assignment-engine.js";
import { newDoubleOptInAssignment } from "./double-opt-in-assignment.js";

test("DoubleOptInAssignmentEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInAssignmentEngine();
  const item = newDoubleOptInAssignment("code-925", "name-693");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
