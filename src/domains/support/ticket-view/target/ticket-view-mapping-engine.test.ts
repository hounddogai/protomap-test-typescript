import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewMappingEngine } from "./ticket-view-mapping-engine.js";
import { newTicketViewMapping } from "./ticket-view-mapping.js";

test("TicketViewMappingEngine keeps results within bounds", () => {
  const engine = defaultTicketViewMappingEngine(flags.newRegistry());
  const item = newTicketViewMapping("code-87", "title-328");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
