import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPacingLedgerEngine } from "./pacing-ledger-engine.js";
import { newPacingLedger } from "./pacing-ledger.js";

test("PacingLedgerEngine keeps results within bounds", () => {
  const engine = defaultPacingLedgerEngine();
  const item = newPacingLedger("code-626", "name-362");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
