import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalTicketViewLedgerEngine } from "./regional-ticket-view-ledger-engine.js";
import { newRegionalTicketViewLedger } from "./regional-ticket-view-ledger.js";

test("RegionalTicketViewLedgerEngine keeps results within bounds", () => {
  const engine = defaultRegionalTicketViewLedgerEngine();
  const item = newRegionalTicketViewLedger("code-187", "label-814");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
