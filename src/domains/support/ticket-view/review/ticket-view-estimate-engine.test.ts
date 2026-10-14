import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewEstimateEngine } from "./ticket-view-estimate-engine.js";
import { newTicketViewEstimate } from "./ticket-view-estimate.js";

test("TicketViewEstimateEngine keeps results within bounds", () => {
  const engine = defaultTicketViewEstimateEngine(flags.newRegistry());
  const item = newTicketViewEstimate("code-104", "name-731");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
