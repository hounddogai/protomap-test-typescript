import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStepLedgerEngine } from "./step-ledger-engine.js";
import { newStepLedger } from "./step-ledger.js";

test("StepLedgerEngine keeps results within bounds", () => {
  const engine = defaultStepLedgerEngine(flags.newRegistry());
  const item = newStepLedger("code-691", "name-246");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
