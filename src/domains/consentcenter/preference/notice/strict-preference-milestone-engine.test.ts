import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictPreferenceMilestoneEngine } from "./strict-preference-milestone-engine.js";
import { newStrictPreferenceMilestone } from "./strict-preference-milestone.js";

test("StrictPreferenceMilestoneEngine keeps results within bounds", () => {
  const engine = defaultStrictPreferenceMilestoneEngine();
  const item = newStrictPreferenceMilestone("code-568", "name-413");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
