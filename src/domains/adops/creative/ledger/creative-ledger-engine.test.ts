import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeLedgerEngine } from "./creative-ledger-engine.js";
import { newCreativeLedger } from "./creative-ledger.js";

test("CreativeLedgerEngine keeps results within bounds", () => {
  const engine = defaultCreativeLedgerEngine();
  const item = newCreativeLedger("code-741", "title-366");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
