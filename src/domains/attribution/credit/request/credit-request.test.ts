import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditRequest } from "./credit-request.js";

test("CreditRequest starts in proposed", () => {
  const item = newCreditRequest("code-320", "label-517");
  assert.equal(item.status, "proposed", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditRequest moves to approved", () => {
  const item = newCreditRequest("code-320", "label-517");
  try {
    item.moveTo("approved");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "approved", "status");
});

test("CreditRequest rejects moves from withdrawn", () => {
  const item = newCreditRequest("code-320", "label-517");
  item.status = "withdrawn";
  assert.throws(() => item.moveTo("proposed"), Error, "move");
});
