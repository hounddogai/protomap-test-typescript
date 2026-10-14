import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictBranchMilestoneEngine } from "./strict-branch-milestone-engine.js";
import { newStrictBranchMilestone } from "./strict-branch-milestone.js";

test("StrictBranchMilestoneEngine keeps results within bounds", () => {
  const engine = defaultStrictBranchMilestoneEngine(flags.newRegistry());
  const item = newStrictBranchMilestone("code-614", "name-315");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
