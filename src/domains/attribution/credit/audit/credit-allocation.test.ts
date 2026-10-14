import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditAllocation } from "./credit-allocation.js";

test("CreditAllocation starts in created", () => {
  const item = newCreditAllocation("code-943", "name-690");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditAllocation moves to validated", () => {
  const item = newCreditAllocation("code-943", "name-690");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CreditAllocation rejects moves from retired", () => {
  const item = newCreditAllocation("code-943", "name-690");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
