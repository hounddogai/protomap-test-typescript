import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalAssignmentEngine } from "./approval-assignment-engine.js";
import { newApprovalAssignment } from "./approval-assignment.js";

test("ApprovalAssignmentEngine keeps results within bounds", () => {
  const engine = defaultApprovalAssignmentEngine();
  const item = newApprovalAssignment("code-61", "title-716");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
