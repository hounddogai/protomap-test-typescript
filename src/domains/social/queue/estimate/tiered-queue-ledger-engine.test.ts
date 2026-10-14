import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredQueueLedgerEngine } from "./tiered-queue-ledger-engine.js";
import { newTieredQueueLedger } from "./tiered-queue-ledger.js";

test("TieredQueueLedgerEngine keeps results within bounds", () => {
  const engine = defaultTieredQueueLedgerEngine(flags.newRegistry());
  const item = newTieredQueueLedger("code-898", "title-881");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
