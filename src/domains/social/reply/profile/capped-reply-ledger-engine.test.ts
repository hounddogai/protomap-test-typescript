import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedReplyLedgerEngine } from "./capped-reply-ledger-engine.js";
import { newCappedReplyLedger } from "./capped-reply-ledger.js";

test("CappedReplyLedgerEngine keeps results within bounds", () => {
  const engine = defaultCappedReplyLedgerEngine();
  const item = newCappedReplyLedger("code-848", "title-172");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
