import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDomainLedger } from "./tiered-domain-ledger.js";

test("TieredDomainLedger starts in proposed", () => {
  const item = newTieredDomainLedger("code-979", "name-260");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDomainLedger moves to rejected", () => {
  const item = newTieredDomainLedger("code-979", "name-260");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("TieredDomainLedger rejects moves from withdrawn", () => {
  const item = newTieredDomainLedger("code-979", "name-260");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
