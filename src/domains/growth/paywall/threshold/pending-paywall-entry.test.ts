import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPaywallEntry } from "./pending-paywall-entry.js";

test("PendingPaywallEntry starts in proposed", () => {
  const item = newPendingPaywallEntry("code-101", "name-868");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPaywallEntry moves to withdrawn", () => {
  const item = newPendingPaywallEntry("code-101", "name-868");
  try {
    item.moveTo("withdrawn");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "withdrawn", "status");
});

test("PendingPaywallEntry rejects moves from withdrawn", () => {
  const item = newPendingPaywallEntry("code-101", "name-868");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
