import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelLedgerEngine } from "./level-ledger-engine.js";
import { newLevelLedger } from "./level-ledger.js";

test("LevelLedgerEngine keeps results within bounds", () => {
  const engine = defaultLevelLedgerEngine();
  const item = newLevelLedger("code-402", "name-256");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
