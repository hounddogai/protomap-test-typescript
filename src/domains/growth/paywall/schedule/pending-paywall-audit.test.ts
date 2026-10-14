import assert from "node:assert/strict";
import { test } from "node:test";
import { newPendingPaywallAudit } from "./pending-paywall-audit.js";

test("PendingPaywallAudit starts in draft", () => {
  const item = newPendingPaywallAudit("code-896", "label-591");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PendingPaywallAudit moves to suspended", () => {
  const item = newPendingPaywallAudit("code-896", "label-591");
  try {
    item.moveTo("suspended");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "suspended", "status");
});

test("PendingPaywallAudit rejects moves from closed", () => {
  const item = newPendingPaywallAudit("code-896", "label-591");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
