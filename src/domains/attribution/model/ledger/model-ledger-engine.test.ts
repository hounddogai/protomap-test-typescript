import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelLedgerEngine } from "./model-ledger-engine.js";
import { newModelLedger } from "./model-ledger.js";

test("ModelLedgerEngine keeps results within bounds", () => {
  const engine = defaultModelLedgerEngine(flags.newRegistry());
  const item = newModelLedger("code-366", "label-239");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
