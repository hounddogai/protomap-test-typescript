import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledPreferenceAssignmentEngine } from "./scheduled-preference-assignment-engine.js";
import { newScheduledPreferenceAssignment } from "./scheduled-preference-assignment.js";

test("ScheduledPreferenceAssignmentEngine keeps results within bounds", () => {
  const engine = defaultScheduledPreferenceAssignmentEngine();
  const item = newScheduledPreferenceAssignment("code-835", "title-525");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
