import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalInsightAssignmentEngine } from "./seasonal-insight-assignment-engine.js";
import { newSeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

test("SeasonalInsightAssignmentEngine keeps results within bounds", () => {
  const engine = defaultSeasonalInsightAssignmentEngine();
  const item = newSeasonalInsightAssignment("code-802", "name-813");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
