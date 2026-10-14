import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyLedgerEngine } from "./frequency-ledger-engine.js";
import { newFrequencyLedger } from "./frequency-ledger.js";

test("FrequencyLedgerEngine keeps results within bounds", () => {
  const engine = defaultFrequencyLedgerEngine();
  const item = newFrequencyLedger("code-630", "title-597");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
