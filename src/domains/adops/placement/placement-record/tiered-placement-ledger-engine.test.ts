import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredPlacementLedgerEngine } from "./tiered-placement-ledger-engine.js";
import { newTieredPlacementLedger } from "./tiered-placement-ledger.js";

test("TieredPlacementLedgerEngine keeps results within bounds", () => {
  const engine = defaultTieredPlacementLedgerEngine(flags.newRegistry());
  const item = newTieredPlacementLedger("code-510", "label-281");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
