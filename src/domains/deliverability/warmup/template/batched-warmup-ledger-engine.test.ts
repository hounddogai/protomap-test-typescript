import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedWarmupLedgerEngine } from "./batched-warmup-ledger-engine.js";
import { newBatchedWarmupLedger } from "./batched-warmup-ledger.js";

test("BatchedWarmupLedgerEngine keeps results within bounds", () => {
  const engine = defaultBatchedWarmupLedgerEngine();
  const item = newBatchedWarmupLedger("code-984", "title-268");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
