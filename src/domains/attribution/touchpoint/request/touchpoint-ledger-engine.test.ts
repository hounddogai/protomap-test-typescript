import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointLedgerEngine } from "./touchpoint-ledger-engine.js";
import { newTouchpointLedger } from "./touchpoint-ledger.js";

test("TouchpointLedgerEngine keeps results within bounds", () => {
  const engine = defaultTouchpointLedgerEngine();
  const item = newTouchpointLedger("code-752", "title-876");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
