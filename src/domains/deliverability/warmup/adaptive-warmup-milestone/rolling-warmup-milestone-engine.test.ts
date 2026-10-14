import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingWarmupMilestoneEngine } from "./rolling-warmup-milestone-engine.js";
import { newRollingWarmupMilestone } from "./rolling-warmup-milestone.js";

test("RollingWarmupMilestoneEngine keeps results within bounds", () => {
  const engine = defaultRollingWarmupMilestoneEngine();
  const item = newRollingWarmupMilestone("code-695", "label-264");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
