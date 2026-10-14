import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEscalationAssignmentEngine } from "./escalation-assignment-engine.js";
import { newEscalationAssignment } from "./escalation-assignment.js";

test("EscalationAssignmentEngine keeps results within bounds", () => {
  const engine = defaultEscalationAssignmentEngine();
  const item = newEscalationAssignment("code-775", "title-273");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
