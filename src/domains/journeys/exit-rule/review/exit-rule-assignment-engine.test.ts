import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleAssignmentEngine } from "./exit-rule-assignment-engine.js";
import { newExitRuleAssignment } from "./exit-rule-assignment.js";

test("ExitRuleAssignmentEngine keeps results within bounds", () => {
  const engine = defaultExitRuleAssignmentEngine(flags.newRegistry());
  const item = newExitRuleAssignment("code-4", "title-230");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
