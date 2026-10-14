import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultJourneyAssignmentEngine } from "./journey-assignment-engine.js";
import { newJourneyAssignment } from "./journey-assignment.js";

test("JourneyAssignmentEngine keeps results within bounds", () => {
  const engine = defaultJourneyAssignmentEngine();
  const item = newJourneyAssignment("code-462", "title-913");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
