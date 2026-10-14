import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReplyAssignmentEngine } from "./reply-assignment-engine.js";
import { newReplyAssignment } from "./reply-assignment.js";

test("ReplyAssignmentEngine keeps results within bounds", () => {
  const engine = defaultReplyAssignmentEngine();
  const item = newReplyAssignment("code-221", "name-923");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
