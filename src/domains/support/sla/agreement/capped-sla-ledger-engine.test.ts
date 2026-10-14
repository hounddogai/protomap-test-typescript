import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedSlaLedgerEngine } from "./capped-sla-ledger-engine.js";
import { newCappedSlaLedger } from "./capped-sla-ledger.js";

test("CappedSlaLedgerEngine keeps results within bounds", () => {
  const engine = defaultCappedSlaLedgerEngine(flags.newRegistry());
  const item = newCappedSlaLedger("code-934", "label-942");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
