import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTicketViewSlotEngine } from "./ticket-view-slot-engine.js";
import { newTicketViewSlot } from "./ticket-view-slot.js";

test("TicketViewSlotEngine keeps results within bounds", () => {
  const engine = defaultTicketViewSlotEngine();
  const item = newTicketViewSlot("code-319", "title-75");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
