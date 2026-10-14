import assert from "node:assert/strict";
import { test } from "node:test";
import { newRegionalActivationBudget } from "./regional-activation-budget.js";

test("RegionalActivationBudget starts in proposed", () => {
  const item = newRegionalActivationBudget("code-768", "name-513");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("RegionalActivationBudget moves to rejected", () => {
  const item = newRegionalActivationBudget("code-768", "name-513");
  try {
    item.moveTo("rejected");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "rejected", "status");
});

test("RegionalActivationBudget rejects moves from withdrawn", () => {
  const item = newRegionalActivationBudget("code-768", "name-513");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
