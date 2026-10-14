import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionLedgerEngine } from "./conversion-ledger-engine.js";
import { newConversionLedger } from "./conversion-ledger.js";

test("ConversionLedgerEngine keeps results within bounds", () => {
  const engine = defaultConversionLedgerEngine();
  const item = newConversionLedger("code-53", "name-587");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
