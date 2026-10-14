import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalDomainPlanEngine } from "./seasonal-domain-plan-engine.js";
import { newSeasonalDomainPlan } from "./seasonal-domain-plan.js";

test("SeasonalDomainPlanEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDomainPlanEngine(flags.newRegistry());
  const item = newSeasonalDomainPlan("code-180", "title-157");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
