import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewPlanEngine } from "./ticket-view-plan-engine.js";
import { newTicketViewPlan } from "./ticket-view-plan.js";

test("TicketViewPlanEngine keeps results within bounds", () => {
  const engine = defaultTicketViewPlanEngine(flags.newRegistry());
  const item = newTicketViewPlan("code-102", "name-833");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
