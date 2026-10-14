import assert from "node:assert/strict";
import { test } from "node:test";
import { newTieredDomainBudget } from "./tiered-domain-budget.js";

test("TieredDomainBudget starts in draft", () => {
  const item = newTieredDomainBudget("code-904", "name-500");
  assert.equal(item.status, "draft", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("TieredDomainBudget moves to active", () => {
  const item = newTieredDomainBudget("code-904", "name-500");
  try {
    item.moveTo("active");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "active", "status");
});

test("TieredDomainBudget rejects moves from closed", () => {
  const item = newTieredDomainBudget("code-904", "name-500");
  item.status = "closed";
  assert.throws(() => item.moveTo("draft"), Error, "move");
});
