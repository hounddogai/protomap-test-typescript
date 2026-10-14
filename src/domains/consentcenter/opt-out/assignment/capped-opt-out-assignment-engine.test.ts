import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedOptOutAssignmentEngine } from "./capped-opt-out-assignment-engine.js";
import { newCappedOptOutAssignment } from "./capped-opt-out-assignment.js";

test("CappedOptOutAssignmentEngine keeps results within bounds", () => {
  const engine = defaultCappedOptOutAssignmentEngine();
  const item = newCappedOptOutAssignment("code-621", "title-611");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
