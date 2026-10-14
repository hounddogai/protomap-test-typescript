import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalLedgerEngine } from "./approval-ledger-engine.js";
import { newApprovalLedger } from "./approval-ledger.js";

test("ApprovalLedgerEngine keeps results within bounds", () => {
  const engine = defaultApprovalLedgerEngine();
  const item = newApprovalLedger("code-351", "name-348");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
