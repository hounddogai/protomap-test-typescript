import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditLedgerEngine } from "./credit-ledger-engine.js";
import { newCreditLedger } from "./credit-ledger.js";

test("CreditLedgerEngine keeps results within bounds", () => {
  const engine = defaultCreditLedgerEngine(flags.newRegistry());
  const item = newCreditLedger("code-951", "name-96");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
