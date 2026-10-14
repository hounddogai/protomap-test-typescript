import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackTicketViewSlotEngine } from "./fallback-ticket-view-slot-engine.js";
import { newFallbackTicketViewSlot } from "./fallback-ticket-view-slot.js";

test("FallbackTicketViewSlotEngine keeps results within bounds", () => {
  const engine = defaultFallbackTicketViewSlotEngine(flags.newRegistry());
  const item = newFallbackTicketViewSlot("code-510", "name-631");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
