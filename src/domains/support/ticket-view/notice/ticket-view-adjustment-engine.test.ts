import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewAdjustmentEngine } from "./ticket-view-adjustment-engine.js";
import { newTicketViewAdjustment } from "./ticket-view-adjustment.js";

test("TicketViewAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultTicketViewAdjustmentEngine(flags.newRegistry());
  const item = newTicketViewAdjustment("code-256", "name-826");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
