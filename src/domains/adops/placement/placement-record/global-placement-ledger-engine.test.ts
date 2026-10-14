import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalPlacementLedgerEngine } from "./global-placement-ledger-engine.js";
import { newGlobalPlacementLedger } from "./global-placement-ledger.js";

test("GlobalPlacementLedgerEngine keeps results within bounds", () => {
  const engine = defaultGlobalPlacementLedgerEngine();
  const item = newGlobalPlacementLedger("code-245", "title-435");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
