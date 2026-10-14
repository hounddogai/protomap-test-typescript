import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalBadgeAssignmentEngine } from "./regional-badge-assignment-engine.js";
import { newRegionalBadgeAssignment } from "./regional-badge-assignment.js";

test("RegionalBadgeAssignmentEngine keeps results within bounds", () => {
  const engine = defaultRegionalBadgeAssignmentEngine();
  const item = newRegionalBadgeAssignment("code-276", "title-719");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
