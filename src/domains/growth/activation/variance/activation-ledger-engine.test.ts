import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationLedgerEngine } from "./activation-ledger-engine.js";
import { newActivationLedger } from "./activation-ledger.js";

test("ActivationLedgerEngine keeps results within bounds", () => {
  const engine = defaultActivationLedgerEngine();
  const item = newActivationLedger("code-873", "label-254");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
