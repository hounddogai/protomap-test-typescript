import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalWarmupMilestoneEngine } from "./global-warmup-milestone-engine.js";
import { newGlobalWarmupMilestone } from "./global-warmup-milestone.js";

test("GlobalWarmupMilestoneEngine keeps results within bounds", () => {
  const engine = defaultGlobalWarmupMilestoneEngine();
  const item = newGlobalWarmupMilestone("code-338", "name-743");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
