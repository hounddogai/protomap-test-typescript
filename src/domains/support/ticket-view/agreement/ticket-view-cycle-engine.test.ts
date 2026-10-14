import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewCycleEngine } from "./ticket-view-cycle-engine.js";
import { newTicketViewCycle } from "./ticket-view-cycle.js";

test("TicketViewCycleEngine keeps results within bounds", () => {
  const engine = defaultTicketViewCycleEngine(flags.newRegistry());
  const item = newTicketViewCycle("code-996", "title-556");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
