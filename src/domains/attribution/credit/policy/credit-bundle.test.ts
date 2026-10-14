import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditBundle } from "./credit-bundle.js";

test("CreditBundle starts in planned", () => {
  const item = newCreditBundle("code-87", "title-733");
  assert.equal(item.status, "planned", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditBundle moves to scheduled", () => {
  const item = newCreditBundle("code-87", "title-733");
  try {
    item.moveTo("scheduled");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "scheduled", "status");
});

test("CreditBundle rejects moves from cancelled", () => {
  const item = newCreditBundle("code-87", "title-733");
  item.status = "cancelled";
  assert.throws(() => item.moveTo("planned"), Error, "move");
});
