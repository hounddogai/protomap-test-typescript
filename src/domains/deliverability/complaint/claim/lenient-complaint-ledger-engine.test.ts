import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientComplaintLedgerEngine } from "./lenient-complaint-ledger-engine.js";
import { newLenientComplaintLedger } from "./lenient-complaint-ledger.js";

test("LenientComplaintLedgerEngine keeps results within bounds", () => {
  const engine = defaultLenientComplaintLedgerEngine(flags.newRegistry());
  const item = newLenientComplaintLedger("code-895", "name-21");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
