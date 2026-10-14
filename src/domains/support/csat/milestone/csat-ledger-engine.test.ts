import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCsatLedgerEngine } from "./csat-ledger-engine.js";
import { newCsatLedger } from "./csat-ledger.js";

test("CsatLedgerEngine keeps results within bounds", () => {
  const engine = defaultCsatLedgerEngine(flags.newRegistry());
  const item = newCsatLedger("code-893", "name-684");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
