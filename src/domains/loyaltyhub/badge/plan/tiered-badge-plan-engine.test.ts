import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredBadgePlanEngine } from "./tiered-badge-plan-engine.js";
import { newTieredBadgePlan } from "./tiered-badge-plan.js";

test("TieredBadgePlanEngine keeps results within bounds", () => {
  const engine = defaultTieredBadgePlanEngine();
  const item = newTieredBadgePlan("code-826", "name-985");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
