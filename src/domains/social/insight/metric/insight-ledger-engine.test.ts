import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightLedgerEngine } from "./insight-ledger-engine.js";
import { newInsightLedger } from "./insight-ledger.js";

test("InsightLedgerEngine keeps results within bounds", () => {
  const engine = defaultInsightLedgerEngine();
  const item = newInsightLedger("code-961", "title-167");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
