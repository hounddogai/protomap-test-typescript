import assert from "node:assert/strict";
import { test } from "node:test";
import { newBidRuleLedger } from "./bid-rule-ledger.js";

test("BidRuleLedger starts in requested", () => {
  const item = newBidRuleLedger("code-295", "label-281");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("BidRuleLedger moves to revoked", () => {
  const item = newBidRuleLedger("code-295", "label-281");
  try {
    item.moveTo("revoked");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "revoked", "status");
});

test("BidRuleLedger rejects moves from expired", () => {
  const item = newBidRuleLedger("code-295", "label-281");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
