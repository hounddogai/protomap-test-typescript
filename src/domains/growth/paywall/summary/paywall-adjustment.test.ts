import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallAdjustment } from "./paywall-adjustment.js";

test("PaywallAdjustment starts in open", () => {
  const item = newPaywallAdjustment("code-652", "name-205");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallAdjustment moves to archived", () => {
  const item = newPaywallAdjustment("code-652", "name-205");
  try {
    item.moveTo("archived");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "archived", "status");
});

test("PaywallAdjustment rejects moves from archived", () => {
  const item = newPaywallAdjustment("code-652", "name-205");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
