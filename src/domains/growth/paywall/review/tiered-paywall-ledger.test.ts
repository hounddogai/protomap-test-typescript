import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredPaywallLedger } from "./tiered-paywall-ledger.js";

test("TieredPaywallLedger starts in draft", () => {
  const item = newTieredPaywallLedger("code-357", "name-217");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredPaywallLedger moves to suspended", () => {
  const item = newTieredPaywallLedger("code-357", "name-217");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("TieredPaywallLedger rejects moves from closed", () => {
  const item = newTieredPaywallLedger("code-357", "name-217");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
