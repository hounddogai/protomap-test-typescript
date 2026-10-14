import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleMilestoneEngine } from "./exit-rule-milestone-engine.js";
import { newExitRuleMilestone } from "./exit-rule-milestone.js";

test("ExitRuleMilestoneEngine keeps results within bounds", () => {
  const engine = defaultExitRuleMilestoneEngine();
  const item = newExitRuleMilestone("code-70", "label-249");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
