import assert from "node:assert/strict";
import { test } from "node:test";
import { newApprovalLedger } from "./approval-ledger.js";

test("ApprovalLedger starts in created", () => {
  const item = newApprovalLedger("code-351", "name-348");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ApprovalLedger moves to retired", () => {
  const item = newApprovalLedger("code-351", "name-348");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("ApprovalLedger rejects moves from retired", () => {
  const item = newApprovalLedger("code-351", "name-348");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
