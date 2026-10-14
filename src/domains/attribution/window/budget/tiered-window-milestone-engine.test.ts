import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredWindowMilestoneEngine } from "./tiered-window-milestone-engine.js";
import { newTieredWindowMilestone } from "./tiered-window-milestone.js";

test("TieredWindowMilestoneEngine keeps results within bounds", () => {
  const engine = defaultTieredWindowMilestoneEngine();
  const item = newTieredWindowMilestone("code-356", "label-213");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
