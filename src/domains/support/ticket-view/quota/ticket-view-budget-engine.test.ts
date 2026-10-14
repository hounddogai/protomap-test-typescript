import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewBudgetEngine } from "./ticket-view-budget-engine.js";
import { newTicketViewBudget } from "./ticket-view-budget.js";

test("TicketViewBudgetEngine keeps results within bounds", () => {
  const engine = defaultTicketViewBudgetEngine(flags.newRegistry());
  const item = newTicketViewBudget("code-350", "title-906");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
