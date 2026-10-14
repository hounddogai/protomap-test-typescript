import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredDomainLedgerEngine } from "./tiered-domain-ledger-engine.js";
import { newTieredDomainLedger } from "./tiered-domain-ledger.js";

test("TieredDomainLedgerEngine keeps results within bounds", () => {
  const engine = defaultTieredDomainLedgerEngine();
  const item = newTieredDomainLedger("code-979", "name-260");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
