import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementMilestoneEngine } from "./placement-milestone-engine.js";
import { newPlacementMilestone } from "./placement-milestone.js";

test("PlacementMilestoneEngine keeps results within bounds", () => {
  const engine = defaultPlacementMilestoneEngine();
  const item = newPlacementMilestone("code-46", "name-983");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
