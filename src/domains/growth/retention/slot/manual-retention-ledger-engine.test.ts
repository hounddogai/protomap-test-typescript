import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualRetentionLedgerEngine } from "./manual-retention-ledger-engine.js";
import { newManualRetentionLedger } from "./manual-retention-ledger.js";

test("ManualRetentionLedgerEngine keeps results within bounds", () => {
  const engine = defaultManualRetentionLedgerEngine();
  const item = newManualRetentionLedger("code-283", "title-306");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
