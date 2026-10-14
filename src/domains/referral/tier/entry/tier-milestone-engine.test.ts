import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierMilestoneEngine } from "./tier-milestone-engine.js";
import { newTierMilestone } from "./tier-milestone.js";

test("TierMilestoneEngine keeps results within bounds", () => {
  const engine = defaultTierMilestoneEngine();
  const item = newTierMilestone("code-223", "title-528");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
