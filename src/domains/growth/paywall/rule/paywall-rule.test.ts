import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallRule } from "./paywall-rule.js";

test("PaywallRule starts in new", () => {
  const item = newPaywallRule("code-934", "title-136");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallRule moves to failed", () => {
  const item = newPaywallRule("code-934", "title-136");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("PaywallRule rejects moves from failed", () => {
  const item = newPaywallRule("code-934", "title-136");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
