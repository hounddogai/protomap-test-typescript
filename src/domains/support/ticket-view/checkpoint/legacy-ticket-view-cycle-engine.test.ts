import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyTicketViewCycleEngine } from "./legacy-ticket-view-cycle-engine.js";
import { newLegacyTicketViewCycle } from "./legacy-ticket-view-cycle.js";

test("LegacyTicketViewCycleEngine keeps results within bounds", () => {
  const engine = defaultLegacyTicketViewCycleEngine(flags.newRegistry());
  const item = newLegacyTicketViewCycle("code-95", "name-345");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
