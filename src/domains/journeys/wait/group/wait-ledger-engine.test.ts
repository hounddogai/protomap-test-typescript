import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitLedgerEngine } from "./wait-ledger-engine.js";
import { newWaitLedger } from "./wait-ledger.js";

test("WaitLedgerEngine keeps results within bounds", () => {
  const engine = defaultWaitLedgerEngine();
  const item = newWaitLedger("code-82", "name-835");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
