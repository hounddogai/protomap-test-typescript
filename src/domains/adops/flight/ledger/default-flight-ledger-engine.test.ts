import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultFlightLedgerEngine } from "./default-flight-ledger-engine.js";
import { newDefaultFlightLedger } from "./default-flight-ledger.js";

test("DefaultFlightLedgerEngine keeps results within bounds", () => {
  const engine = defaultDefaultFlightLedgerEngine(flags.newRegistry());
  const item = newDefaultFlightLedger("code-900", "label-50");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
