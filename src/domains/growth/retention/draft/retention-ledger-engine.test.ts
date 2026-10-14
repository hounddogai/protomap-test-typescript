import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRetentionLedgerEngine } from "./retention-ledger-engine.js";
import { newRetentionLedger } from "./retention-ledger.js";

test("RetentionLedgerEngine keeps results within bounds", () => {
  const engine = defaultRetentionLedgerEngine();
  const item = newRetentionLedger("code-480", "name-573");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
