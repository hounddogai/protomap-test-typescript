import assert from "node:assert/strict";
import { test } from "node:test";
import { newManualCreditLedger } from "./manual-credit-ledger.js";

test("ManualCreditLedger starts in planned", () => {
  const item = newManualCreditLedger("code-232", "label-466");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("ManualCreditLedger moves to completed", () => {
  const item = newManualCreditLedger("code-232", "label-466");
  try {
    item.moveTo("completed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "completed", "status");
});

test("ManualCreditLedger rejects moves from cancelled", () => {
  const item = newManualCreditLedger("code-232", "label-466");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
