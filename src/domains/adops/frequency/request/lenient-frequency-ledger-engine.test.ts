import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientFrequencyLedgerEngine } from "./lenient-frequency-ledger-engine.js";
import { newLenientFrequencyLedger } from "./lenient-frequency-ledger.js";

test("LenientFrequencyLedgerEngine keeps results within bounds", () => {
  const engine = defaultLenientFrequencyLedgerEngine(flags.newRegistry());
  const item = newLenientFrequencyLedger("code-24", "name-314");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
