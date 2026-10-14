import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingPayoutLedgerEngine } from "./pending-payout-ledger-engine.js";
import { newPendingPayoutLedger } from "./pending-payout-ledger.js";

test("PendingPayoutLedgerEngine keeps results within bounds", () => {
  const engine = defaultPendingPayoutLedgerEngine();
  const item = newPendingPayoutLedger("code-230", "label-275");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
