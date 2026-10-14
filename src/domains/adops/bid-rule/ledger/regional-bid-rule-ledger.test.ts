import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalBidRuleLedger } from "./regional-bid-rule-ledger.js";

test("RegionalBidRuleLedger starts in created", () => {
  const item = newRegionalBidRuleLedger("code-913", "label-253");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalBidRuleLedger moves to validated", () => {
  const item = newRegionalBidRuleLedger("code-913", "label-253");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("RegionalBidRuleLedger rejects moves from retired", () => {
  const item = newRegionalBidRuleLedger("code-913", "label-253");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
