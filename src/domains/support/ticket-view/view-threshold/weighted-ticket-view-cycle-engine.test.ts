import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedTicketViewCycleEngine } from "./weighted-ticket-view-cycle-engine.js";
import { newWeightedTicketViewCycle } from "./weighted-ticket-view-cycle.js";

test("WeightedTicketViewCycleEngine keeps results within bounds", () => {
  const engine = defaultWeightedTicketViewCycleEngine(flags.newRegistry());
  const item = newWeightedTicketViewCycle("code-819", "label-198");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
