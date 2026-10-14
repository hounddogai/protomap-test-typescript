import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditClaim } from "./credit-claim.js";

test("CreditClaim starts in planned", () => {
  const item = newCreditClaim("code-441", "name-366");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditClaim moves to in progress", () => {
  const item = newCreditClaim("code-441", "name-366");
  try {
    item.moveTo("in_progress");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "in_progress", "status");
});

test("CreditClaim rejects moves from cancelled", () => {
  const item = newCreditClaim("code-441", "name-366");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
