import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortLedgerEngine } from "./cohort-ledger-engine.js";
import { newCohortLedger } from "./cohort-ledger.js";

test("CohortLedgerEngine keeps results within bounds", () => {
  const engine = defaultCohortLedgerEngine();
  const item = newCohortLedger("code-261", "name-879");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
