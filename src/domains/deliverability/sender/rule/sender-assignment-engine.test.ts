import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSenderAssignmentEngine } from "./sender-assignment-engine.js";
import { newSenderAssignment } from "./sender-assignment.js";

test("SenderAssignmentEngine keeps results within bounds", () => {
  const engine = defaultSenderAssignmentEngine();
  const item = newSenderAssignment("code-58", "name-981");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
