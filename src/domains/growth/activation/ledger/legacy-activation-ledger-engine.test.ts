import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyActivationLedgerEngine } from "./legacy-activation-ledger-engine.js";
import { newLegacyActivationLedger } from "./legacy-activation-ledger.js";

test("LegacyActivationLedgerEngine keeps results within bounds", () => {
  const engine = defaultLegacyActivationLedgerEngine();
  const item = newLegacyActivationLedger("code-40", "title-521");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
