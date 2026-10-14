import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditTier } from "./credit-tier.js";

test("CreditTier starts in created", () => {
  const item = newCreditTier("code-85", "label-354");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditTier moves to validated", () => {
  const item = newCreditTier("code-85", "label-354");
  try {
    item.moveTo("validated");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "validated", "status");
});

test("CreditTier rejects moves from retired", () => {
  const item = newCreditTier("code-85", "label-354");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
