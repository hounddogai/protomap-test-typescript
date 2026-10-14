import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledWarmupMilestoneEngine } from "./scheduled-warmup-milestone-engine.js";
import { newScheduledWarmupMilestone } from "./scheduled-warmup-milestone.js";

test("ScheduledWarmupMilestoneEngine keeps results within bounds", () => {
  const engine = defaultScheduledWarmupMilestoneEngine();
  const item = newScheduledWarmupMilestone("code-343", "label-451");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
