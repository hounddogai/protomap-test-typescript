import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingPlacementLedgerEngine } from "./rolling-placement-ledger-engine.js";
import { newRollingPlacementLedger } from "./rolling-placement-ledger.js";

test("RollingPlacementLedgerEngine keeps results within bounds", () => {
  const engine = defaultRollingPlacementLedgerEngine(flags.newRegistry());
  const item = newRollingPlacementLedger("code-443", "name-485");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
