import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleLedgerEngine } from "./bid-rule-ledger-engine.js";
import { newBidRuleLedger } from "./bid-rule-ledger.js";

test("BidRuleLedgerEngine keeps results within bounds", () => {
  const engine = defaultBidRuleLedgerEngine();
  const item = newBidRuleLedger("code-295", "label-281");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
