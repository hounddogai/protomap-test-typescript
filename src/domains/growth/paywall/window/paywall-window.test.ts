import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallWindow } from "./paywall-window.js";

test("PaywallWindow starts in planned", () => {
  const item = newPaywallWindow("code-49", "label-324");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallWindow moves to cancelled", () => {
  const item = newPaywallWindow("code-49", "label-324");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("PaywallWindow rejects moves from cancelled", () => {
  const item = newPaywallWindow("code-49", "label-324");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
