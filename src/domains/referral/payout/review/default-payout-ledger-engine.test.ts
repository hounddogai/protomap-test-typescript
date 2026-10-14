import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPayoutLedgerEngine } from "./default-payout-ledger-engine.js";
import { newDefaultPayoutLedger } from "./default-payout-ledger.js";

test("DefaultPayoutLedgerEngine keeps results within bounds", () => {
  const engine = defaultDefaultPayoutLedgerEngine(flags.newRegistry());
  const item = newDefaultPayoutLedger("code-502", "title-73");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
