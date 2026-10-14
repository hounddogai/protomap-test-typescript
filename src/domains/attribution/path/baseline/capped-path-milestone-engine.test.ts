import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedPathMilestoneEngine } from "./capped-path-milestone-engine.js";
import { newCappedPathMilestone } from "./capped-path-milestone.js";

test("CappedPathMilestoneEngine keeps results within bounds", () => {
  const engine = defaultCappedPathMilestoneEngine();
  const item = newCappedPathMilestone("code-119", "label-770");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
