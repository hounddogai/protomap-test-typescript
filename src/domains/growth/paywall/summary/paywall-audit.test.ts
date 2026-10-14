import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallAudit } from "./paywall-audit.js";

test("PaywallAudit starts in open", () => {
  const item = newPaywallAudit("code-320", "label-227");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallAudit moves to in review", () => {
  const item = newPaywallAudit("code-320", "label-227");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("PaywallAudit rejects moves from archived", () => {
  const item = newPaywallAudit("code-320", "label-227");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
