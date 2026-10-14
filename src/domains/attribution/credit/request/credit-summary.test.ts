import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditSummary } from "./credit-summary.js";

test("CreditSummary starts in open", () => {
  const item = newCreditSummary("code-810", "name-821");
  assert.equal(item.status, "open", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditSummary moves to resolved", () => {
  const item = newCreditSummary("code-810", "name-821");
  try {
    item.moveTo("resolved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "resolved", "status");
});

test("CreditSummary rejects moves from archived", () => {
  const item = newCreditSummary("code-810", "name-821");
  item.status = "archived";
  assert.throws(() => item.moveTo("open"), Error, "move");
});
