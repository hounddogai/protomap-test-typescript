import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewEntryEngine } from "./ticket-view-entry-engine.js";
import { newTicketViewEntry } from "./ticket-view-entry.js";

test("TicketViewEntryEngine keeps results within bounds", () => {
  const engine = defaultTicketViewEntryEngine(flags.newRegistry());
  const item = newTicketViewEntry("code-74", "title-421");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
