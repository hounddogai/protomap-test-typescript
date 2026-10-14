import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyEscalationLedgerEngine } from "./legacy-escalation-ledger-engine.js";
import { newLegacyEscalationLedger } from "./legacy-escalation-ledger.js";

test("LegacyEscalationLedgerEngine keeps results within bounds", () => {
  const engine = defaultLegacyEscalationLedgerEngine(flags.newRegistry());
  const item = newLegacyEscalationLedger("code-334", "label-980");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
