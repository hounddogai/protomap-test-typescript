import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledDoubleOptInLedgerEngine } from "./scheduled-double-opt-in-ledger-engine.js";
import { newScheduledDoubleOptInLedger } from "./scheduled-double-opt-in-ledger.js";

test("ScheduledDoubleOptInLedgerEngine keeps results within bounds", () => {
  const engine = defaultScheduledDoubleOptInLedgerEngine();
  const item = newScheduledDoubleOptInLedger("code-325", "title-61");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
