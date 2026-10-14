import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedMentionLedgerEngine } from "./batched-mention-ledger-engine.js";
import { newBatchedMentionLedger } from "./batched-mention-ledger.js";

test("BatchedMentionLedgerEngine keeps results within bounds", () => {
  const engine = defaultBatchedMentionLedgerEngine(flags.newRegistry());
  const item = newBatchedMentionLedger("code-398", "label-877");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
