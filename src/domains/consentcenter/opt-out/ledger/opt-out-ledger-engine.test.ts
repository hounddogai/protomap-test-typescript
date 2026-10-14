import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutLedgerEngine } from "./opt-out-ledger-engine.js";
import { newOptOutLedger } from "./opt-out-ledger.js";

test("OptOutLedgerEngine keeps results within bounds", () => {
  const engine = defaultOptOutLedgerEngine(flags.newRegistry());
  const item = newOptOutLedger("code-656", "name-769");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
