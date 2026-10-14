import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalPayoutLedgerEngine } from "./seasonal-payout-ledger-engine.js";
import { newSeasonalPayoutLedger } from "./seasonal-payout-ledger.js";

test("SeasonalPayoutLedgerEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPayoutLedgerEngine();
  const item = newSeasonalPayoutLedger("code-22", "title-148");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
