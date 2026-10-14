import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedActivationLedgerEngine } from "./weighted-activation-ledger-engine.js";
import { newWeightedActivationLedger } from "./weighted-activation-ledger.js";

test("WeightedActivationLedgerEngine keeps results within bounds", () => {
  const engine = defaultWeightedActivationLedgerEngine();
  const item = newWeightedActivationLedger("code-201", "title-378");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
