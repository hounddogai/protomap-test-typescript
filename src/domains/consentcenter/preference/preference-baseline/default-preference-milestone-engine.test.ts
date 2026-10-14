import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultPreferenceMilestoneEngine } from "./default-preference-milestone-engine.js";
import { newDefaultPreferenceMilestone } from "./default-preference-milestone.js";

test("DefaultPreferenceMilestoneEngine keeps results within bounds", () => {
  const engine = defaultDefaultPreferenceMilestoneEngine();
  const item = newDefaultPreferenceMilestone("code-119", "title-342");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
