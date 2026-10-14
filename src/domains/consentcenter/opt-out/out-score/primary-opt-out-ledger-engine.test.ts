import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryOptOutLedgerEngine } from "./primary-opt-out-ledger-engine.js";
import { newPrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

test("PrimaryOptOutLedgerEngine keeps results within bounds", () => {
  const engine = defaultPrimaryOptOutLedgerEngine(flags.newRegistry());
  const item = newPrimaryOptOutLedger("code-239", "title-605");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
