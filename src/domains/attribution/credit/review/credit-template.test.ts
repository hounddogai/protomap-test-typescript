import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditTemplate } from "./credit-template.js";

test("CreditTemplate starts in planned", () => {
  const item = newCreditTemplate("code-282", "name-286");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditTemplate moves to cancelled", () => {
  const item = newCreditTemplate("code-282", "name-286");
  try {
    item.moveTo("cancelled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "cancelled", "status");
});

test("CreditTemplate rejects moves from cancelled", () => {
  const item = newCreditTemplate("code-282", "name-286");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
