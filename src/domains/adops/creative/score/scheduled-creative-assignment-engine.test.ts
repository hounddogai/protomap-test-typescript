import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledCreativeAssignmentEngine } from "./scheduled-creative-assignment-engine.js";
import { newScheduledCreativeAssignment } from "./scheduled-creative-assignment.js";

test("ScheduledCreativeAssignmentEngine keeps results within bounds", () => {
  const engine = defaultScheduledCreativeAssignmentEngine();
  const item = newScheduledCreativeAssignment("code-456", "title-708");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
