import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaLedgerEngine } from "./sla-ledger-engine.js";
import { newSlaLedger } from "./sla-ledger.js";

test("SlaLedgerEngine keeps results within bounds", () => {
  const engine = defaultSlaLedgerEngine(flags.newRegistry());
  const item = newSlaLedger("code-851", "name-731");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
