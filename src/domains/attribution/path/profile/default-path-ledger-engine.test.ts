import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPathLedgerEngine } from "./default-path-ledger-engine.js";
import { newDefaultPathLedger } from "./default-path-ledger.js";

test("DefaultPathLedgerEngine keeps results within bounds", () => {
  const engine = defaultDefaultPathLedgerEngine(flags.newRegistry());
  const item = newDefaultPathLedger("code-172", "name-798");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
