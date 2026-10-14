import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionMilestoneEngine } from "./subscription-milestone-engine.js";
import { newSubscriptionMilestone } from "./subscription-milestone.js";

test("SubscriptionMilestoneEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionMilestoneEngine();
  const item = newSubscriptionMilestone("code-163", "title-699");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
