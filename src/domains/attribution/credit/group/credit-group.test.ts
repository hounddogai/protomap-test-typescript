import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditGroup } from "./credit-group.js";

test("CreditGroup starts in new", () => {
  const item = newCreditGroup("code-89", "name-224");
  assert.equal(item.status, "new", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditGroup moves to failed", () => {
  const item = newCreditGroup("code-89", "name-224");
  try {
    item.moveTo("failed");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "failed", "status");
});

test("CreditGroup rejects moves from failed", () => {
  const item = newCreditGroup("code-89", "name-224");
  item.status = "failed";
  assert.throws(() => item.moveTo("new"), Error, "move");
});
