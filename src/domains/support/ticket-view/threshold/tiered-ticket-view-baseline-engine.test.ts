import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredTicketViewBaselineEngine } from "./tiered-ticket-view-baseline-engine.js";
import { newTieredTicketViewBaseline } from "./tiered-ticket-view-baseline.js";

test("TieredTicketViewBaselineEngine keeps results within bounds", () => {
  const engine = defaultTieredTicketViewBaselineEngine(flags.newRegistry());
  const item = newTieredTicketViewBaseline("code-200", "name-332");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
