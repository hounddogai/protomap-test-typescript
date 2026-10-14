import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedCreditLedgerEngine } from "./batched-credit-ledger-engine.js";
import { newBatchedCreditLedger } from "./batched-credit-ledger.js";

test("BatchedCreditLedgerEngine keeps results within bounds", () => {
  const engine = defaultBatchedCreditLedgerEngine(flags.newRegistry());
  const item = newBatchedCreditLedger("code-135", "label-260");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
