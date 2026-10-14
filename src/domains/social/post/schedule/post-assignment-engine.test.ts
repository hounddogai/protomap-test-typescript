import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostAssignmentEngine } from "./post-assignment-engine.js";
import { newPostAssignment } from "./post-assignment.js";

test("PostAssignmentEngine keeps results within bounds", () => {
  const engine = defaultPostAssignmentEngine();
  const item = newPostAssignment("code-58", "title-952");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
