import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPayoutLedger } from "./default-payout-ledger.js";

test("DefaultPayoutLedger starts in proposed", () => {
  const item = newDefaultPayoutLedger("code-502", "title-73");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPayoutLedger moves to approved", () => {
  const item = newDefaultPayoutLedger("code-502", "title-73");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("DefaultPayoutLedger rejects moves from withdrawn", () => {
  const item = newDefaultPayoutLedger("code-502", "title-73");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
