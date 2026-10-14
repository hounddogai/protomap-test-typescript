import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalPaywallLedger } from "./regional-paywall-ledger.js";

test("RegionalPaywallLedger starts in requested", () => {
  const item = newRegionalPaywallLedger("code-155", "label-775");
  assert.equal(item.status, "requested", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalPaywallLedger moves to granted", () => {
  const item = newRegionalPaywallLedger("code-155", "label-775");
  try {
    item.moveTo("granted");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "granted", "status");
});

test("RegionalPaywallLedger rejects moves from expired", () => {
  const item = newRegionalPaywallLedger("code-155", "label-775");
  item.status = "expired";
  assert.throws(() => item.moveTo("requested"), Error, "move");
});
