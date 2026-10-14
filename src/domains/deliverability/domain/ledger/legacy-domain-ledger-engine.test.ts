import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyDomainLedgerEngine } from "./legacy-domain-ledger-engine.js";
import { newLegacyDomainLedger } from "./legacy-domain-ledger.js";

test("LegacyDomainLedgerEngine keeps results within bounds", () => {
  const engine = defaultLegacyDomainLedgerEngine();
  const item = newLegacyDomainLedger("code-623", "label-137");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
