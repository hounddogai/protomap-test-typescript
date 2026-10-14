import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFlightLedgerEngine } from "./flight-ledger-engine.js";
import { newFlightLedger } from "./flight-ledger.js";

test("FlightLedgerEngine keeps results within bounds", () => {
  const engine = defaultFlightLedgerEngine();
  const item = newFlightLedger("code-292", "title-685");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
