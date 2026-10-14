import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredDoubleOptInAssignmentEngine } from "./tiered-double-opt-in-assignment-engine.js";
import { newTieredDoubleOptInAssignment } from "./tiered-double-opt-in-assignment.js";

test("TieredDoubleOptInAssignmentEngine keeps results within bounds", () => {
  const engine = defaultTieredDoubleOptInAssignmentEngine();
  const item = newTieredDoubleOptInAssignment("code-27", "name-576");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
