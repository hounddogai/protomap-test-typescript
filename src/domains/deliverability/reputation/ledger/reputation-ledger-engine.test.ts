import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReputationLedgerEngine } from "./reputation-ledger-engine.js";
import { newReputationLedger } from "./reputation-ledger.js";

test("ReputationLedgerEngine keeps results within bounds", () => {
  const engine = defaultReputationLedgerEngine();
  const item = newReputationLedger("code-288", "label-869");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
