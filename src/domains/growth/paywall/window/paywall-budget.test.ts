import assert from "node:assert/strict";
import { test } from "node:test";
import { newPaywallBudget } from "./paywall-budget.js";

test("PaywallBudget starts in idle", () => {
  const item = newPaywallBudget("code-812", "name-246");
  assert.equal(item.status, "idle", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("PaywallBudget moves to warming", () => {
  const item = newPaywallBudget("code-812", "name-246");
  try {
    item.moveTo("warming");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "warming", "status");
});

test("PaywallBudget rejects moves from stopped", () => {
  const item = newPaywallBudget("code-812", "name-246");
  item.status = "stopped";
  assert.throws(() => item.moveTo("idle"), Error, "move");
});
