import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditLedger } from "./credit-ledger.js";

test("CreditLedger starts in proposed", () => {
  const item = newCreditLedger("code-951", "name-96");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditLedger moves to rejected", () => {
  const item = newCreditLedger("code-951", "name-96");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("CreditLedger rejects moves from withdrawn", () => {
  const item = newCreditLedger("code-951", "name-96");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
