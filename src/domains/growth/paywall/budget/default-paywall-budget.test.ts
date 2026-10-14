import assert from "node:assert/strict";
import { test } from "node:test";
import { newDefaultPaywallBudget } from "./default-paywall-budget.js";

test("DefaultPaywallBudget starts in open", () => {
  const item = newDefaultPaywallBudget("code-66", "name-545");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("DefaultPaywallBudget moves to in review", () => {
  const item = newDefaultPaywallBudget("code-66", "name-545");
  try {
    item.moveTo("in_review");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_review", "status");
});

test("DefaultPaywallBudget rejects moves from archived", () => {
  const item = newDefaultPaywallBudget("code-66", "name-545");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
