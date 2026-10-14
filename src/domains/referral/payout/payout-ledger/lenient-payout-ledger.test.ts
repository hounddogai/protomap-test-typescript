import assert from "node:assert/strict";
import { test } from "node:test";
import { newLenientPayoutLedger } from "./lenient-payout-ledger.js";

test("LenientPayoutLedger starts in draft", () => {
  const item = newLenientPayoutLedger("code-532", "title-665");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("LenientPayoutLedger moves to closed", () => {
  const item = newLenientPayoutLedger("code-532", "title-665");
  try {
    item.moveTo("closed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "closed", "status");
});

test("LenientPayoutLedger rejects moves from closed", () => {
  const item = newLenientPayoutLedger("code-532", "title-665");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
