import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewTargetEngine } from "./ticket-view-target-engine.js";
import { newTicketViewTarget } from "./ticket-view-target.js";

test("TicketViewTargetEngine keeps results within bounds", () => {
  const engine = defaultTicketViewTargetEngine(flags.newRegistry());
  const item = newTicketViewTarget("code-469", "label-957");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
