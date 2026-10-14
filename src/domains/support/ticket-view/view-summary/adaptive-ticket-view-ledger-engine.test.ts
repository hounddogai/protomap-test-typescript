import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveTicketViewLedgerEngine } from "./adaptive-ticket-view-ledger-engine.js";
import { newAdaptiveTicketViewLedger } from "./adaptive-ticket-view-ledger.js";

test("AdaptiveTicketViewLedgerEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveTicketViewLedgerEngine(flags.newRegistry());
  const item = newAdaptiveTicketViewLedger("code-30", "label-59");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
