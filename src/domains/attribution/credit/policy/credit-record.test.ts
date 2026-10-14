import assert from "node:assert/strict";
import { test } from "node:test";
import { newCreditRecord } from "./credit-record.js";

test("CreditRecord starts in created", () => {
  const item = newCreditRecord("code-910", "label-237");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("CreditRecord moves to retired", () => {
  const item = newCreditRecord("code-910", "label-237");
  try {
    item.moveTo("retired");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "retired", "status");
});

test("CreditRecord rejects moves from retired", () => {
  const item = newCreditRecord("code-910", "label-237");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});
