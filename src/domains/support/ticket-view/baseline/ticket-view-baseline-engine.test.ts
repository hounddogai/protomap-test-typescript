import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewBaselineEngine } from "./ticket-view-baseline-engine.js";
import { newTicketViewBaseline } from "./ticket-view-baseline.js";

test("TicketViewBaselineEngine keeps results within bounds", () => {
  const engine = defaultTicketViewBaselineEngine(flags.newRegistry());
  const item = newTicketViewBaseline("code-638", "name-998");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
