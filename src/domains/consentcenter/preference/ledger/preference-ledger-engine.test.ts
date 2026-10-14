import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPreferenceLedgerEngine } from "./preference-ledger-engine.js";
import { newPreferenceLedger } from "./preference-ledger.js";

test("PreferenceLedgerEngine keeps results within bounds", () => {
  const engine = defaultPreferenceLedgerEngine();
  const item = newPreferenceLedger("code-439", "title-62");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
