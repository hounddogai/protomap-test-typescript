import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultBidRulePlanEngine } from "./default-bid-rule-plan-engine.js";
import { newDefaultBidRulePlan } from "./default-bid-rule-plan.js";

test("DefaultBidRulePlanEngine keeps results within bounds", () => {
  const engine = defaultDefaultBidRulePlanEngine();
  const item = newDefaultBidRulePlan("code-841", "name-201");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
