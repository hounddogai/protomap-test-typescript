import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditAgreement } from "./credit-agreement.js";

test("CreditAgreement starts in created", () => {
  const item = newCreditAgreement("code-329", "label-818");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditAgreement moves to published", () => {
  const item = newCreditAgreement("code-329", "label-818");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("CreditAgreement rejects moves from retired", () => {
  const item = newCreditAgreement("code-329", "label-818");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
