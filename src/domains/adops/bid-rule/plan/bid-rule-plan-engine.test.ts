import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRulePlanEngine } from "./bid-rule-plan-engine.js";
import { newBidRulePlan } from "./bid-rule-plan.js";

test("BidRulePlanEngine keeps results within bounds", () => {
  const engine = defaultBidRulePlanEngine();
  const item = newBidRulePlan("code-723", "name-679");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
