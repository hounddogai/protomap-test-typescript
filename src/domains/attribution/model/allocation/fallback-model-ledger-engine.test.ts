import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackModelLedgerEngine } from "./fallback-model-ledger-engine.js";
import { newFallbackModelLedger } from "./fallback-model-ledger.js";

test("FallbackModelLedgerEngine keeps results within bounds", () => {
  const engine = defaultFallbackModelLedgerEngine(flags.newRegistry());
  const item = newFallbackModelLedger("code-661", "name-896");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
