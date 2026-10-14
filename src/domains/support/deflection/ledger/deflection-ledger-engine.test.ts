import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionLedgerEngine } from "./deflection-ledger-engine.js";
import { newDeflectionLedger } from "./deflection-ledger.js";

test("DeflectionLedgerEngine keeps results within bounds", () => {
  const engine = defaultDeflectionLedgerEngine(flags.newRegistry());
  const item = newDeflectionLedger("code-361", "name-709");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
